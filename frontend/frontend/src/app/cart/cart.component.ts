import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService, CartItem } from '../shared/cart.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
    readonly fallbackImg = 'assets/pexels-ella-olsson-572949-1640773.jpg';

    constructor(public cart: CartService) { }

    increment(item: CartItem) {
        this.cart.updateQuantity(item.id, 1);
    }

    decrement(item: CartItem) {
        this.cart.updateQuantity(item.id, -1);
    }
}
