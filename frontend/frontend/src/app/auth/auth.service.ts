import { Inject, Injectable, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, ReplaySubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

// central authentication state stored in memory and local storage
export interface AuthState {
  isLoggedIn: boolean;
  role: Role | null;
  username: string | null;
  displayName: string | null;
  userId: number | null;
  restaurantId: number | null;
}

type LoginResponse = {
  id: number;
  name: string;
  role: Role;
  restaurantId: number | null;
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  // BehaviorSubject: holds current state and emits updates to subscribers
  private readonly _state$ = new BehaviorSubject<AuthState>({
    isLoggedIn: false,
    role: null,
    username: null,
    displayName: null,
    userId: null,
    restaurantId: null,
  });

  // ReplaySubject: emits cached value; helps components wait until local storage is loaded
  private readonly _authReady$ = new ReplaySubject<boolean>(1);

  readonly state$: Observable<AuthState> = this._state$.asObservable();

  // Emits true once auth state has been loaded from localStorage (or immediately if not in browser)
  readonly authReady$: Observable<boolean> = this._authReady$.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Use setTimeout to ensure this runs after Angular hydration
      setTimeout(() => {
        this.ngZone.run(() => {
          const raw = localStorage.getItem('auth_state');
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as AuthState;
              this._state$.next(parsed);

              // If user is logged in but restaurantId is missing, fetch it from server
              if (parsed.isLoggedIn && parsed.role === 'RESTAURANT_OWNER' && parsed.restaurantId == null) {
                this.refreshRestaurantId(parsed);
              }
            } catch {
              /* ignore invalid storage */
            }
          }
          this._authReady$.next(true);
        });
      }, 0);
    } else {
      // On server, mark as ready immediately (no localStorage available)
      this._authReady$.next(true);
    }
  }

  // returns the stored JWT token (null if not logged in)
  get token(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private refreshRestaurantId(currentState: AuthState) {
    if (!currentState.userId) return;

    // No need to set x-user-id – the interceptor adds the Bearer token automatically
    this.http.get<{ restaurantId: number | null }>(`${environment.apiUrl}/account/me`).subscribe({
      next: (res) => {
        if (res.restaurantId != null) {
          const updated: AuthState = { ...currentState, restaurantId: res.restaurantId };
          this._state$.next(updated);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('auth_state', JSON.stringify(updated));
          }
        }
      },
      error: () => { /* ignore */ }
    });
  }

  // synchronous snapshot of current auth state; useful for guards, role checks, quick reads
  currentState(): AuthState {
    return this._state$.value;
  }

  // login and updates auth state + local storage
  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((result) => {
          const next: AuthState = {
            isLoggedIn: true,
            role: result.role,
            username,
            displayName: result.name ?? username,
            userId: result.id,
            restaurantId: result.restaurantId,
          };

          this._state$.next(next);

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('auth_state', JSON.stringify(next));
            localStorage.setItem('auth_token', result.token);
          }
        })
      );
  }

  // clears auth state + local storage
  logout() {
    const empty: AuthState = {
      isLoggedIn: false,
      role: null,
      username: null,
      displayName: null,
      userId: null,
      restaurantId: null,
    };

    this._state$.next(empty);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_state');
      localStorage.removeItem('auth_token');
    }
  }
}
