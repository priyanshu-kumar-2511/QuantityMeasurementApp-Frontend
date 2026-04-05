import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, switchMap } from 'rxjs';
import { AuthResponse, LoginRequest, SignUpRequest, User } from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'qm_access_token';
  private readonly REFRESH_KEY = 'qm_refresh_token';
  private readonly USER_KEY = 'qm_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── SIGNUP ──────────────────────────────────────────────────────
  signup(data: SignUpRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/register`, data, {
      responseType: 'text'
    });
  }

  // ── LOGIN ───────────────────────────────────────────────────────
  login(data: LoginRequest): Observable<any> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, data).pipe(
      tap((res) => {
        sessionStorage.setItem(this.TOKEN_KEY, res.accessToken);
        sessionStorage.setItem(this.REFRESH_KEY, res.refreshToken);

        // Temporary user set karo
        const tempUser: User = { id: 0, name: data.email, email: data.email };
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(tempUser));
        this.currentUserSubject.next(tempUser);
      }),
      switchMap(() =>
        this.http.get<any>(`${environment.apiUrl}/api/user/me`)
      ),
      tap((userDetails) => {
        const firstName = userDetails.firstName || '';
        const lastName = userDetails.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || data.email;

        const user: User = {
          id: userDetails.id,
          name: fullName,
          email: userDetails.email,
        };
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  // ── LOGOUT ──────────────────────────────────────────────────────
  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).subscribe({ error: () => {} });
    }
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ── REFRESH TOKEN ───────────────────────────────────────────────
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = sessionStorage.getItem(this.REFRESH_KEY) || '';
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap((res) => {
        sessionStorage.setItem(this.TOKEN_KEY, res.accessToken);
      })
    );
  }

  // ── HELPERS ─────────────────────────────────────────────────────
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    try {
      return JSON.parse(sessionStorage.getItem(this.USER_KEY) || 'null');
    } catch {
      return null;
    }
  }
}