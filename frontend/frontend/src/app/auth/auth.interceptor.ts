import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * HTTP Interceptor that automatically adds the Authorization: Bearer <token>
 * header to all outgoing requests when the user is logged in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return authService.authReady$.pipe(
    take(1),
    switchMap(() => {
      const token = authService.token;

      // Only add header if a JWT token is available
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(clonedReq);
      }

      return next(req);
    })
  );
};
