import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface FacultyStats {
  courseId: string;
  courseName: string;
  courseCode: string;
  averageScore: number;
  detailedRatings: { questionId: string; questionText: string; average: number }[];
  totalSubmissions: number;
}

@Injectable({ providedIn: 'root' })
export class FacultyService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/faculty`;

  getDashboardStats(): Observable<{ success: boolean; data: { stats: FacultyStats[] } }> {
    return this.http.get<any>(`${this.API}/dashboard`, { withCredentials: true });
  }

  getOverallSummary(): Observable<{ success: boolean; data: { overallAverage: number; totalResponses: number } }> {
    return this.http.get<any>(`${this.API}/summary`, { withCredentials: true });
  }

  // Alias for getOverallSummary matching Phase 9 specification
  getSummary(): Observable<{ success: boolean; data: { overallAverage: number; totalResponses: number } }> {
    return this.getOverallSummary();
  }

  getCourseRemarks(courseId: string): Observable<{ success: boolean; data: { remarks: { remark: string; createdAt: string }[] } }> {
    return this.http.get<any>(`${this.API}/remarks/${courseId}`, { withCredentials: true });
  }

  getAIRemarkSummary(courseId: string): Observable<{ success: boolean; data: { summary: { strengths: string[]; improvements: string[]; sentiment: string } } }> {
    return this.http.get<any>(`${this.API}/ai-summary/${courseId}`, { withCredentials: true });
  }

  // Alias for getAIRemarkSummary matching Phase 9 specification
  getAIRemarksSummary(courseId: string): Observable<{ success: boolean; data: { summary: { strengths: string[]; improvements: string[]; sentiment: string } } }> {
    return this.getAIRemarkSummary(courseId);
  }
}
