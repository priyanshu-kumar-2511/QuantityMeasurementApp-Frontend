import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Skip auth header for login/signup/refresh
  const isAuthRoute =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/signup') ||
    req.url.includes('/api/auth/refresh');

  const authReq = token && !isAuthRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 → try refresh token once
      if (error.status === 401 && !isAuthRoute) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(retried);
          }),
          catchError((refreshErr) => {
            // Refresh also failed → logout
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
