import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface CartItem {
    id: number;
    title: string;
    description: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
    restaurantId: number;
    restaurantName: string;
}

export interface CheckoutResponse {
    id: number;
    restaurantId: number;
    restaurantName: string;
    items: { title: string; quantity: number; price: number }[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
    private userId: number | null = null;

    private get STORAGE_KEY(): string {
        return this.userId ? `cart_items_${this.userId}` : 'cart_items_guest';
    }

    private readonly _items$ = new BehaviorSubject<CartItem[]>([]);
    readonly items$ = this._items$.asObservable();

    constructor(
        @Inject(PLATFORM_ID) private platformId: object,
        private http: HttpClient,
        private authService: AuthService
    ) {
        // Subscribe to auth state changes to update userId
        this.authService.state$.subscribe(state => {
            const newUserId = state.isLoggedIn ? state.userId : null;
            if (newUserId !== this.userId) {
                this.userId = newUserId;
                this.loadFromStorage();
            }
        });
    }

    /**
     * Set the current user ID. Call this on login/logout.
     * This will load the user's cart from localStorage.
     */
    setUserId(userId: number | null): void {
        this.userId = userId;
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        if (isPlatformBrowser(this.platformId)) {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                try {
                    const items = JSON.parse(raw) as CartItem[];
                    // Ensure prices are numbers
                    const normalizedItems = items.map(item => ({
                        ...item,
                        price: Number(item.price)
                    }));
                    this._items$.next(normalizedItems);
                } catch {
                    this._items$.next([]);
                }
            } else {
                this._items$.next([]);
            }
        }
    }

    private persist(items: CartItem[]) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        }
    }

    addItem(item: Omit<CartItem, 'quantity'>) {
        const items = [...this._items$.value];
        const existing = items.find(i => i.id === item.id);

        if (existing) {
            existing.quantity++;
        } else {
            items.push({ ...item, quantity: 1 });
        }

        this._items$.next(items);
        this.persist(items);
    }

    updateQuantity(itemId: number, delta: number) {
        let items = [...this._items$.value];
        const item = items.find(i => i.id === itemId);

        if (item) {
            item.quantity += delta;

            // Bei 0 entfernen
            if (item.quantity <= 0) {
                items = items.filter(i => i.id !== itemId);
            }

            this._items$.next(items);
            this.persist(items);
        }
    }

    removeItem(itemId: number) {
        const items = this._items$.value.filter(i => i.id !== itemId);
        this._items$.next(items);
        this.persist(items);
    }

    getTotal(): number {
        return this._items$.value.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    getItemCount(): number {
        return this._items$.value.reduce(
            (count, item) => count + item.quantity,
            0
        );
    }

    clear() {
        this._items$.next([]);
        this.persist([]);
    }

    /**
     * Checkout: Create an order in the backend
     * Groups items by restaurant and creates one order per restaurant
     */
    checkout(): Observable<CheckoutResponse[]> {
        if (!this.userId) {
            throw new Error('User must be logged in to checkout');
        }

        const items = this._items$.value;
        if (items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Group items by restaurant
        const byRestaurant = items.reduce((acc, item) => {
            if (!acc[item.restaurantId]) {
                acc[item.restaurantId] = [];
            }
            acc[item.restaurantId].push({
                menuItemId: item.id,
                quantity: item.quantity,
            });
            return acc;
        }, {} as Record<number, { menuItemId: number; quantity: number }[]>);

        // Create orders for each restaurant
        const restaurantIds = Object.keys(byRestaurant).map(Number);

        // For simplicity, we'll create orders sequentially
        // In this case, we're assuming one restaurant per order
        const restaurantId = restaurantIds[0];
        const orderItems = byRestaurant[restaurantId];

        return this.http.post<CheckoutResponse[]>(`${environment.apiUrl}/restaurants/orders`, {
            userId: this.userId,
            restaurantId,
            items: orderItems,
        });
    }
}
