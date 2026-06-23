import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ActiveSession {
  id: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityEventLog {
  _id: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly API_PRIVACY = `${environment.apiUrl}/privacy`;
  private readonly API_AUTH = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // ============================================================
  // SESSION MONITORING & REVOCATION
  // ============================================================
  getActiveSessions(): Observable<{ success: boolean; data: { sessions: ActiveSession[] } }> {
    return this.http.get<any>(`${this.API_AUTH}/sessions`, { withCredentials: true });
  }

  revokeSession(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.API_AUTH}/sessions/${sessionId}`, { withCredentials: true });
  }

  // ============================================================
  // SUDO MODE RE-AUTHENTICATION
  // ============================================================
  enterSudoMode(password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.API_AUTH}/sudo`, { password }, { withCredentials: true });
  }

  // ============================================================
  // PERSONAL SECURITY LOG STREAM
  // ============================================================
  getSecurityEvents(): Observable<{ success: boolean; data: { logs: SecurityEventLog[] } }> {
    return this.http.get<any>(`${this.API_PRIVACY}/security-events`, { withCredentials: true });
  }

  // ============================================================
  // DATA PRINCIPAL RIGHTS (DPDP ACT)
  // ============================================================
  getMyData(): Observable<any> {
    return this.http.get<any>(`${this.API_PRIVACY}/my-data`, { withCredentials: true });
  }

  updateMyData(payload: { name: string; phone?: string }): Observable<any> {
    return this.http.put<any>(`${this.API_PRIVACY}/my-data`, payload, { withCredentials: true });
  }

  exportMyData(): Observable<any> {
    return this.http.get<any>(`${this.API_PRIVACY}/data-export`, { withCredentials: true });
  }

  eraseMyData(): Observable<any> {
    return this.http.delete<any>(`${this.API_PRIVACY}/my-data`, { withCredentials: true });
  }

  // ============================================================
  // CONSENT MANAGEMENT
  // ============================================================
  getConsentStatus(): Observable<any> {
    return this.http.get<any>(`${this.API_PRIVACY}/consent`, { withCredentials: true });
  }

  giveConsent(consentType: string, consentGiven: boolean): Observable<any> {
    return this.http.post<any>(`${this.API_PRIVACY}/consent`, { consentType, consentGiven }, { withCredentials: true });
  }

  withdrawConsent(): Observable<any> {
    return this.http.delete<any>(`${this.API_PRIVACY}/consent`, { withCredentials: true });
  }
}
