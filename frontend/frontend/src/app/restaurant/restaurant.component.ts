import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../shared/cart.service';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './restaurant.html',
  styleUrls: ['./restaurant.scss'],
})
export class RestaurantComponent implements OnInit {
  restaurant: any;
  rating: number | null = null;
  categories: any[] = [];
  otherItems: any[] = [];

  isOwner = false;
  isLoggedIn = false;
  isOtherUser = false;

  readonly fallbackImg = 'assets/fallback_image.png';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private cart: CartService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.loadRestaurant(id);
    });
  }

  private loadRestaurant(id: number) {
    this.restaurant = null; // Reset while loading
    this.http.get<any>(`${environment.apiUrl}/api/restaurants/${id}/details`).subscribe((res) => {
      this.restaurant = res.restaurant;
      this.rating = res.rating;
      this.categories = res.restaurant.categories;
      this.otherItems = res.otherItems;

      const state = this.auth.currentState();
      this.isLoggedIn = state.isLoggedIn;
      this.isOwner =
        state.role === 'RESTAURANT_OWNER' &&
        state.userId === this.restaurant.ownerId;
      this.isOtherUser = this.isLoggedIn && !this.isOwner;

      this.cdr.detectChanges();
    });
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    this.http.delete(`${environment.apiUrl}/api/restaurants/menu-items/${id}`).subscribe(() => {
      location.reload();
    });
  }

  rate(rating: number) {
    this.http.post(`${environment.apiUrl}/api/restaurants/${this.restaurant.id}/rate`, { rating }).subscribe();
  }

  addToCart(item: any) {
    this.cart.addItem({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      restaurantId: this.restaurant.id,
      restaurantName: this.restaurant.name,
    });
  }
}
