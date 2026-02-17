import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
import { filter, switchMap, takeUntil, Subject, combineLatest, map, distinctUntilChanged } from 'rxjs';

type OrderItem = { title: string; quantity: number };

type Order = {
    id: number;
    status: 'PENDING' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | null;
    createdAt: string;
    userName: string;
    userAddress: string;
    restaurantName?: string;
    items: OrderItem[];
};

type OrdersResponse = {
    restaurantName: string;
    orders: Order[];
};

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
    restaurantName = '';
    orders: Order[] = [];
    loading = true;
    error = ''; // <--- Added error property

    private restaurantId: number | null = null;
    private destroy$ = new Subject<void>();

    role: string | null = null;
    currentUserId: number | null = null;

    constructor(private http: HttpClient, private auth: AuthService) { }

    ngOnInit(): void {
        // Updated auth loading logic
        combineLatest([this.auth.authReady$, this.auth.state$]).pipe(
            filter(([ready]) => ready),
            map(([, s]) => s),
            filter(s => s.isLoggedIn),
            // Für Owner: restaurantId muss da sein, sonst warten
            filter(s => s.role !== 'RESTAURANT_OWNER' || !!s.restaurantId),
            distinctUntilChanged((a, b) =>
                a.role === b.role && a.userId === b.userId && a.restaurantId === b.restaurantId
            ),
            takeUntil(this.destroy$)
        ).subscribe(s => {
            this.loading = true;
            this.role = s.role;
            this.currentUserId = s.userId;

            if (s.role === 'RESTAURANT_OWNER') {
                this.restaurantId = s.restaurantId!;
                this.loadRestaurantOrders();
            } else {
                this.loadCustomerOrders();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // loads all restaurant orders for logged-in restaurant owner
    private loadRestaurantOrders(): void {
        if (!this.restaurantId) return;

        this.loading = true; // Ensure loading is reset if called again
        this.error = '';
        this.orders = []; // <--- Clear stale data

        this.http
            .get<OrdersResponse>(`${environment.apiUrl}/restaurants/${this.restaurantId}/orders`)
            .subscribe({
                next: (res) => {
                    this.restaurantName = res.restaurantName;
                    this.orders = res.orders;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err?.error?.message ?? 'Could not load orders.';
                    this.loading = false;
                },
            });
    }

    // loads all customer orders for logged-in customer
    private loadCustomerOrders(): void {
        this.loading = true;
        this.error = '';
        this.orders = []; // <--- Clear stale data

        this.http
            .get<{ orders: Order[] }>(`${environment.apiUrl}/account/orders`)
            .subscribe({
                next: (res) => {
                    // For customers, the concept of "restaurantName" is per order, not per page. 
                    // But we can leave restaurantName empty or set it to "My Orders" in the template title.
                    this.orders = res.orders;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err?.error?.message ?? 'Could not load orders.';
                    this.loading = false;
                },
            });
    }

    // updates order status
    setStatus(order: Order, status: 'PREPARING' | 'DELIVERING' | 'COMPLETED'): void {
        this.http
            .patch<{ id: number; status: string }>(
                `${environment.apiUrl}/restaurants/orders/${order.id}/status`,
                { status }
            )
            .subscribe({
                next: () => {
                    order.status = status;
                },
            });
    }

    // controls button availability depending on current order status
    canClick(order: Order, button: 'PREPARING' | 'DELIVERING' | 'COMPLETED'): boolean {
        const current = order.status;
        if (button === 'PREPARING') return current === null || current === 'PENDING';
        if (button === 'DELIVERING') return current === 'PREPARING';
        if (button === 'COMPLETED') return current === 'DELIVERING';
        return false;
    }

    // formats order items for display
    formatItems(items: OrderItem[]): string {
        return items.map((i) => `${i.quantity}x ${i.title}`).join(', ');
    }
}
