import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../shared/cart.service';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './restaurant.html',
  styleUrls: ['./restaurant.scss'],
})
export class RestaurantComponent implements OnInit {
  restaurant: any;
  rating: number | null = null;
  categories: any[] = [];
  otherItems: any[] = [];
  deliveryTimeMin: number | null = null;

  isOwner = false;
  isLoggedIn = false;
  isOtherUser = false;

  activeCategoryId: number | 'other' | null = null;
  private observer: IntersectionObserver | null = null;

  readonly fallbackImg = 'assets/fallback_image.png';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private cart: CartService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.loadRestaurant(id);
    });
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadRestaurant(id: number) {
    this.restaurant = null; // Reset while loading

    // Build URL with optional userRegionId for delivery time calculation
    const state = this.auth.currentState();
    let url = `${environment.apiUrl}/restaurants/${id}/details`;
    if (state.isLoggedIn && state.regionId) {
      url += `?userRegionId=${state.regionId}`;
    }

    this.http.get<any>(url).subscribe((res) => {
      this.restaurant = res.restaurant;
      this.rating = res.rating;
      this.categories = res.restaurant.categories;
      this.otherItems = res.otherItems;
      this.deliveryTimeMin = res.deliveryTimeMin ?? null;

      this.isLoggedIn = state.isLoggedIn;
      this.isOwner =
        state.role === 'RESTAURANT_OWNER' &&
        state.userId === this.restaurant.ownerId;
      this.isOtherUser = this.isLoggedIn && !this.isOwner;

      this.cdr.detectChanges();

      // Delay slightly to ensure DOM is ready
      setTimeout(() => this.setupObserver(), 100);
    });
  }

  private setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '-100px 0px -70% 0px', // Trigger when section is near top
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'cat-other') {
            this.activeCategoryId = 'other';
          } else if (id.startsWith('cat-')) {
            this.activeCategoryId = Number(id.replace('cat-', ''));
          } else {
            this.activeCategoryId = null;
          }
          this.cdr.detectChanges(); // Update view
        }
      });
    }, options);

    // Observe all category sections
    document.querySelectorAll('section[id^="cat-"]').forEach(section => {
      this.observer?.observe(section);
    });
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    this.http.delete(`${environment.apiUrl}/restaurants/menu-items/${id}`).subscribe(() => {
      location.reload();
    });
  }

  rate(rating: number) {
    this.http.post(`${environment.apiUrl}/restaurants/${this.restaurant.id}/rate`, { rating }).subscribe(() => {
      // Optionally show success or reload
      this.closeRatingModal();
    });
  }

  // Rating Modal Logic
  showRatingModal = false;
  currentRating = 0;
  hoverRating = 0;

  openRatingModal() {
    this.currentRating = 0;
    this.hoverRating = 0;
    this.showRatingModal = true;
  }

  closeRatingModal() {
    this.showRatingModal = false;
  }

  setHoverRating(stars: number) {
    this.hoverRating = stars;
  }

  selectRating(stars: number) {
    this.currentRating = stars;
  }

  submitRating() {
    if (this.currentRating > 0) {
      this.rate(this.currentRating);
    }
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

  getRatingStars(rating?: number | null): string {
    if (rating === null || rating === undefined) return '☆☆☆☆☆';

    // Round to nearest whole number for star display
    const stars = Math.round(rating);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}

