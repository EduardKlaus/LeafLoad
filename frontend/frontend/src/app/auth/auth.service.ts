import { Injectable } from '@angular/core';
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
  user: { username: string; role: Role; displayName?: string | null };
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
  // state§ = this.authState.state$

  constructor(private http: HttpClient) {
    const raw = localStorage.getItem('auth_state');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        this._state$.next(parsed);
      } catch {/* ignore */}
    }
  }

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((result) => {
          const next: AuthState = {
            isLoggedIn: true,
            role: result.user.role,
            username: result.user.username,
            displayName: result.user.displayName ?? result.user.username,
          };
          this._state$.next(next);
          localStorage.setItem('auth_state', JSON.stringify(next));
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
    localStorage.removeItem('auth_state');
  }
}
