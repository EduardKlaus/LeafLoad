import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

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

  readonly fallbackRestaurantImg = 'assets/pexels-pixabay-54455.jpg';
  readonly fallbackItemImg = 'assets/pexels-ella-olsson-572949-1640773.jpg';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.http.get<any>(`/restaurants/${id}/details`).subscribe((res) => {
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
    });
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    this.http.delete(`/restaurants/menu-items/${id}`).subscribe(() => {
      location.reload();
    });
  }

  rate(rating: number) {
    this.http.post(`/restaurants/${this.restaurant.id}/rate`, { rating }).subscribe();
  }
}
