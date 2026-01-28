import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class CartService {
    private readonly STORAGE_KEY = 'cart_items';

    private readonly _items$ = new BehaviorSubject<CartItem[]>([]);
    readonly items$ = this._items$.asObservable();

    constructor(@Inject(PLATFORM_ID) private platformId: object) {
        if (isPlatformBrowser(this.platformId)) {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                try {
                    this._items$.next(JSON.parse(raw));
                } catch { /* ignore */ }
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
}
