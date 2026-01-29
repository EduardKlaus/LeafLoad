import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../shared/cart.service';
import { AuthService } from '../auth/auth.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
    readonly fallbackImg = 'assets/pexels-ella-olsson-572949-1640773.jpg';
    checkoutSuccess = false;
    checkoutError: string | null = null;
    isCheckingOut = false;

    constructor(
        public cart: CartService,
        private auth: AuthService,
        private router: Router
    ) { }

    increment(item: CartItem) {
        this.cart.updateQuantity(item.id, 1);
    }

    decrement(item: CartItem) {
        this.cart.updateQuantity(item.id, -1);
    }

    get isLoggedIn(): boolean {
        return this.auth.currentState().isLoggedIn;
    }

    checkout() {
        if (!this.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }

        this.isCheckingOut = true;
        this.checkoutError = null;

        this.cart.checkout().subscribe({
            next: () => {
                this.checkoutSuccess = true;
                this.cart.clear();
                // Reset success message after 5 seconds
                setTimeout(() => {
                    this.checkoutSuccess = false;
                }, 5000);
            },
            error: (err) => {
                this.checkoutError = err.error?.message || 'Failed to place order. Please try again.';
            },
            complete: () => {
                this.isCheckingOut = false;
            }
        });
    }
}
