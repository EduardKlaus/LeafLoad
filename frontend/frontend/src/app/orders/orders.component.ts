import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

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
export class OrdersComponent implements OnInit {
    restaurantName = '';
    orders: Order[] = [];
    loading = true;

    private restaurantId: number | null = null;

    role: string | null = null;
    currentUserId: number | null = null;

    constructor(private http: HttpClient, private auth: AuthService) { }

    ngOnInit(): void {
        this.auth.state$.subscribe((s: any) => {
            this.role = s?.role ?? null;
            this.currentUserId = s?.userId ?? null;

            if (s?.restaurantId && s.role === 'RESTAURANT_OWNER') {
                this.restaurantId = s.restaurantId;
                this.loadRestaurantOrders();
            } else if (s?.isLoggedIn && s.role === 'CUSTOMER') {
                this.loadCustomerOrders();
            } else {
                this.loading = false;
            }
        });
    }

    private loadRestaurantOrders(): void {
        if (!this.restaurantId) return;

        this.http
            .get<OrdersResponse>(`${environment.apiUrl}/restaurants/${this.restaurantId}/orders`)
            .subscribe({
                next: (res) => {
                    this.restaurantName = res.restaurantName;
                    this.orders = res.orders;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                },
            });
    }

    private loadCustomerOrders(): void {
        this.http
            .get<{ orders: Order[] }>(`${environment.apiUrl}/account/orders`)
            .subscribe({
                next: (res) => {
                    // For customers, the concept of "restaurantName" is per order, not per page. 
                    // But we can leave restaurantName empty or set it to "My Orders" in the template title.
                    this.orders = res.orders;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                },
            });
    }

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

    canClick(order: Order, button: 'PREPARING' | 'DELIVERING' | 'COMPLETED'): boolean {
        const current = order.status;
        if (button === 'PREPARING') return current === null || current === 'PENDING';
        if (button === 'DELIVERING') return current === 'PREPARING';
        if (button === 'COMPLETED') return current === 'DELIVERING';
        return false;
    }

    formatItems(items: OrderItem[]): string {
        return items.map((i) => `${i.quantity}x ${i.title}`).join(', ');
    }
}
