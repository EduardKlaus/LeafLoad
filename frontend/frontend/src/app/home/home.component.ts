import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type Restaurant = {
  id: number;
  name: string;
  imageUrl?: string | null;
  rating?: number | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  restaurants$: Observable<Restaurant[]> | null = null;

  // if restaurant doesn't have an image
  readonly fallbackImage = 'assets/fallback_image.png';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.restaurants$ = this.http.get<Restaurant[]>(`${environment.apiUrl}/restaurants`);
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