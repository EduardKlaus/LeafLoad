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
          /* ignore */
        }
      }
    }
  }

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/auth/login', { username, password }).pipe(
      tap((result) => {
        const next: AuthState = {
          isLoggedIn: true,
          role: result.role,
          username,
          displayName: result.name ?? username,
        };

        this._state$.next(next);

        // ✅ nur im Browser localStorage schreiben
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('auth_state', JSON.stringify(next));
        }
      })
    );
  }

  logout() {
    this._state$.next({
      isLoggedIn: false,
      role: null,
      username: null,
      displayName: null,
    });

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_state');
    }
  }
}
