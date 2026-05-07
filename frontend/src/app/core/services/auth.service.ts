import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id:      string;
  name:    string;
  email:   string;
  role:    'Admin' | 'Faculty' | 'Student';
  section: string | null;
  avatar:  string | null;
  requiresPasswordChange?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // Signal-based reactive state — Angular 18 modern pattern
  private _user  = signal<AuthUser | null>(this.loadFromStorage());
  private _token = signal<string | null>(localStorage.getItem('jwt') ?? null);

  // Public computed signals
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._user());
  readonly userRole    = computed(() => this._user()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<any>(`${this.API}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  register(payload: { name: string; email: string; password: string; role: string }) {
    return this.http.post<any>(`${this.API}/register`, payload, { withCredentials: true })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  changePassword(newPassword: string) {
    return this.http.put<any>(`${this.API}/change-password`, { newPassword }, { withCredentials: true })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  logout() {
    this.http.get(`${this.API}/logout`, { withCredentials: true }).subscribe();
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  handleAuthSuccess(res: any) {
    if (res?.data?.user) {
      this._user.set(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    if (res?.token) {
      this._token.set(res.token);
      localStorage.setItem('jwt', res.token);
    }
  }

  redirectByRole() {
    const user = this._user();
    if (user?.requiresPasswordChange) {
      this.router.navigate(['/reset-password']);
      return;
    }
    
    const role = this.userRole();
    const map: Record<string, string> = { Admin: '/admin', Faculty: '/faculty', Student: '/student' };
    this.router.navigate([map[role ?? ''] ?? '/login']);
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
