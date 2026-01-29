import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

type OrderItem = { title: string; quantity: number };
type Order = {
    id: number;
    status: 'PREPARING' | 'DELIVERING' | 'COMPLETED' | null;
    createdAt: string;
    userName: string;
    userAddress: string;
    items: OrderItem[];
};

type OrdersResponse = {
    restaurantName: string;
    orders: Order[];
};

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, HttpClientModule, RouterModule],
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
    restaurantName = '';
    orders: Order[] = [];
    loading = true;

    private restaurantId: number | null = null;

    constructor(private http: HttpClient, private auth: AuthService) { }

    ngOnInit(): void {
        this.auth.state$.subscribe((s: any) => {
            if (s?.restaurantId) {
                this.restaurantId = s.restaurantId;
                this.loadOrders();
            }
        });
    }

    private loadOrders(): void {
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
        if (button === 'PREPARING') return current === null;
        if (button === 'DELIVERING') return current === 'PREPARING';
        if (button === 'COMPLETED') return current === 'DELIVERING';
        return false;
    }

    formatItems(items: OrderItem[]): string {
        return items.map((i) => `${i.quantity}x ${i.title}`).join(', ');
    }
}
