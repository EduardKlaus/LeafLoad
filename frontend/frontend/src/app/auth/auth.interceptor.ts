import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor that automatically adds the x-user-id header
 * to all outgoing requests when the user is logged in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return authService.authReady$.pipe(
    take(1),
    switchMap(() => {
      const state = authService.currentState();

      // Only add header if user is logged in and has a userId
      if (state.isLoggedIn && state.userId != null) {
        const clonedReq = req.clone({
          setHeaders: {
            'x-user-id': String(state.userId),
          },
        });
        return next(clonedReq);
      }

      return next(req);
    })
  );
};
