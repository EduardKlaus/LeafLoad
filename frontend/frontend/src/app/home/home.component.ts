import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

type Restaurant = {
  id: number;
  name: string;
  imageUrl?: string | null;
  rating?: number | null;
  regionId?: number | null;
}

type Region = { id: number; name: string };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  restaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];

  regions$: Observable<Region[]> | null = null;
  regionId: number | null = null;

  isLoading = true;

  // if restaurant doesn't have an image
  readonly fallbackImage = 'assets/fallback_image.png';

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    // Load Regions
    this.regions$ = this.http.get<Region[]>(`${environment.apiUrl}/regions`);

    // Load Restaurants
    this.http.get<Restaurant[]>(`${environment.apiUrl}/restaurants`).subscribe({
      next: (data) => {
        this.restaurants = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    // Initialize filter from auth state if logged in
    this.auth.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((s: any) => {
      if (s?.isLoggedIn && s.regionId) {
        this.regionId = s.regionId;
        this.applyFilter();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRegionChange(): void {
    this.applyFilter();

    // Persist choice to user profile if logged in
    if (isPlatformBrowser(this.platformId) && this.auth.currentState().isLoggedIn && this.regionId) {
      this.http.patch(`${environment.apiUrl}/account/me`, { regionId: this.regionId }).subscribe();
    }
  }

  applyFilter() {
    if (!this.regionId) {
      this.filteredRestaurants = this.restaurants;
    } else {
      this.filteredRestaurants = this.restaurants.filter(r => r.regionId === this.regionId);
    }
  }

  imgSrc(r: Restaurant): string {
    return (r.imageUrl && r.imageUrl.trim().length > 0) ? r.imageUrl : this.fallbackImage;
  }

  getRatingStars(rating?: number | null): string {
    if (rating === null || rating === undefined) return '☆☆☆☆☆';

    // Round to nearest whole number for star display
    const stars = Math.round(rating);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }

  trackById(_: number, r: Restaurant) {
    return r.id;
  }
}