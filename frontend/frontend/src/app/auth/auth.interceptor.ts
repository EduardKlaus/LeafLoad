import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor that automatically adds the x-user-id header
 * to all outgoing requests when the user is logged in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const state = authService.currentState();

  // console.log('[AuthInterceptor] Request:', req.url, 'State:', state);

  // Only add header if user is logged in and has a userId
  if (state.isLoggedIn && state.userId != null) {
    const clonedReq = req.clone({
      setHeaders: {
        'x-user-id': String(state.userId),
      },
    });
    // console.log('[AuthInterceptor] Added x-user-id:', state.userId);
    return next(clonedReq);
  }

  return next(req);
};
