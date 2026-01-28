import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

type Restaurant = {
  id: number;
  name: string;
  imageUrl?: string | null;
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

  readonly fallbackImage = 'assets/restaurant_fallback.jpg'; // if restaurant doesn't have an image

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.restaurants$ = this.http.get<Restaurant[]>('/api/restaurants');
  }

  imgSrc(r: Restaurant): string {
    return (r.imageUrl && r.imageUrl.trim().length > 0) ? r.imageUrl : this.fallbackImage;
  }

  trackById(_: number, r: Restaurant) {
    return r.id;
  }
}