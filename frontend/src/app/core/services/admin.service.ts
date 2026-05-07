import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AdminStats {
  totalStudents: number;
  totalFeedback: number;
  averageInstituteScore: number;
}

export interface FacultyLeaderboardItem {
  facultyId: string;
  name: string;
  email: string;
  averageScore: number;
  totalSubmissions: number;
}

export interface QuestionItem {
  _id: string;
  questionText: string;
  isActive: boolean;
  createdAt: string;
}

export interface FeedbackSessionItem {
  _id: string;
  sessionName: string;
  isOpen: boolean;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin`;

  getGlobalStats(): Observable<{ success: boolean; data: AdminStats }> {
    return this.http.get<any>(`${this.API}/stats`, { withCredentials: true });
  }

  getFacultyLeaderboard(): Observable<{ success: boolean; data: { leaderboard: FacultyLeaderboardItem[] } }> {
    return this.http.get<any>(`${this.API}/leaderboard`, { withCredentials: true });
  }

  getAllQuestions(): Observable<{ success: boolean; data: { questions: QuestionItem[] } }> {
    return this.http.get<any>(`${this.API}/questions`, { withCredentials: true });
  }

  addQuestion(questionText: string): Observable<any> {
    return this.http.post<any>(`${this.API}/questions`, { questionText }, { withCredentials: true });
  }

  toggleQuestion(questionId: string): Observable<any> {
    return this.http.patch<any>(`${this.API}/questions/${questionId}`, {}, { withCredentials: true });
  }

  getAllSessions(): Observable<{ success: boolean; data: { sessions: FeedbackSessionItem[] } }> {
    return this.http.get<any>(`${this.API}/sessions`, { withCredentials: true });
  }

  createSession(payload: { sessionName: string; startDate: string; endDate: string }): Observable<any> {
    return this.http.post<any>(`${this.API}/sessions`, payload, { withCredentials: true });
  }

  toggleSession(sessionId: string): Observable<any> {
    return this.http.patch<any>(`${this.API}/sessions/${sessionId}/toggle`, {}, { withCredentials: true });
  }

  getUsers(role?: string): Observable<any> {
    const url = role ? `${this.API}/users?role=${role}` : `${this.API}/users`;
    return this.http.get<any>(url, { withCredentials: true });
  }
}
