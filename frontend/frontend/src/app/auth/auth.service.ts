import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

export interface AuthState {
  isLoggedIn: boolean;
  role: Role | null;
  username: string | null;
  displayName: string | null;
  userId: number | null;
}

type LoginResponse = {
  id: number;
  name: string;
  role: Role;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state$ = new BehaviorSubject<AuthState>({
    isLoggedIn: false,
    role: null,
    username: null,
    displayName: null,
    userId: null,
  });

  readonly state$: Observable<AuthState> = this._state$.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('auth_state');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthState;
          this._state$.next(parsed);
        } catch {
          /* ignore invalid storage */
        }
      }
    }
  }

  /**
   * 🔹 Snapshot des aktuellen Auth-States
   * (für Rollen- & Owner-Checks)
   */
  currentState(): AuthState {
    return this._state$.value;
  }

  /**
   * 🔹 Login
   */
  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>('/auth/login', { username, password })
      .pipe(
        tap((result) => {
          const next: AuthState = {
            isLoggedIn: true,
            role: result.role,
            username,
            displayName: result.name ?? username,
            userId: result.id,
          };

          this._state$.next(next);

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('auth_state', JSON.stringify(next));
          }
        })
      );
  }

  /**
   * 🔹 Logout
   */
  logout() {
    const empty: AuthState = {
      isLoggedIn: false,
      role: null,
      username: null,
      displayName: null,
      userId: null,
    };

    this._state$.next(empty);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_state');
    }
  }
}
