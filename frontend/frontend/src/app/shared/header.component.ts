import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

type Region = { id: number; name: string };

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  menuOpen = false;

  regions: Region[] = [];
  regionId: number | null = null;

  private readonly API_REGIONS = `${environment.apiUrl}/regions`;
  private readonly API_ME = `${environment.apiUrl}/account/me`;

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  get state$() {
    return this.auth.state$;
  }

  ngOnInit(): void {
    // Regions laden
    this.http.get<Region[]>(this.API_REGIONS).subscribe({
      next: (r) => (this.regions = r),
      error: () => {
        // optional: still fail silently
      },
    });

    // Region aus Profil übernehmen, sobald eingeloggt
    this.auth.state$.subscribe((s: any) => {
      // Erwartung: AuthState enthält regionId (wenn du es noch nicht drin hast, siehe Hinweis unten)
      if (s?.isLoggedIn) {
        this.regionId = s.regionId ?? null;
      } else {
        this.regionId = null;
      }
    });
  }

  onRegionChange(nextId: number | null): void {
    this.regionId = nextId;

    // nur speichern, wenn eingeloggt und eine Region gewählt
    // und nur im Browser (SSR-sicher)
    if (!isPlatformBrowser(this.platformId)) return;

    if (nextId == null) return;

    this.http.patch(this.API_ME, { regionId: nextId }).subscribe({
      next: () => {
        // optional: du könntest hier auch AuthState aktualisieren, wenn du willst
      },
      error: () => {
        // optional: revert oder Fehlermeldung
      },
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
