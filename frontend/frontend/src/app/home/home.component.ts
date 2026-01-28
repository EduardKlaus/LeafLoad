import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  readonly fallbackImage = 'assets/fallback_image.png'; // if restaurant doesn't have an image

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.restaurants$ = this.http.get<Restaurant[]>(`${environment.apiUrl}/api/restaurants`);
  }

  imgSrc(r: Restaurant): string {
    return (r.imageUrl && r.imageUrl.trim().length > 0) ? r.imageUrl : this.fallbackImage;
  }

  trackById(_: number, r: Restaurant) {
    return r.id;
  }
}