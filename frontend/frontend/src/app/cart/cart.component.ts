import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../shared/cart.service';
import { AuthService } from '../auth/auth.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
    // fallback image for when restaurant doesn't have one
    readonly fallbackImg = 'assets/pexels-ella-olsson-572949-1640773.jpg';
    checkoutSuccess = false;
    checkoutError: string | null = null;
    isCheckingOut = false;

    voucherCode = '';
    discountApplied = false;
    discountAmount = 0;

    readonly validVoucherCode = 'YATO10'; // hardcoded voucher code

    constructor(
        public cart: CartService,
        private auth: AuthService,
        private router: Router
    ) { }

    // increment quantity of an item in the cart
    increment(item: CartItem) {
        this.cart.updateQuantity(item.id, 1);
        this.recalculateDiscount();
    }

    // decrement quantity of an item in the cart
    decrement(item: CartItem) {
        if (item.quantity > 1) {
            this.cart.updateQuantity(item.id, -1);
            this.recalculateDiscount();
        }
    }

    // remove an item from the cart
    removeItem(item: CartItem) {
        this.cart.removeItem(item.id);
        this.recalculateDiscount();
    }

    // check if user is logged in
    get isLoggedIn(): boolean {
        return this.auth.currentState().isLoggedIn;
    }

    // validates voucher code and applies discount
    redeemVoucher() {
        if (this.validVoucherCode && this.voucherCode === this.validVoucherCode) {
            this.discountApplied = true;
            this.recalculateDiscount();
        } else {
            this.discountApplied = false;
            this.recalculateDiscount();
        }
    }

    // recalculates discount amount
    recalculateDiscount() {
        if (this.discountApplied) {
            // 10% discount
            this.discountAmount = this.cart.getTotal() * 0.10;
        } else {
            this.discountAmount = 0;
        }
    }

    // returns final total after discount
    get finalTotal(): number {
        return this.cart.getTotal() - this.discountAmount;
    }

    // handles checkout process
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
                this.discountApplied = false;
                this.voucherCode = '';
                this.discountAmount = 0;

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
