import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface CourseAssignment {
  assignmentId: string;
  course: {
    _id: string;
    courseName: string;
    courseCode: string;
  };
  faculty: {
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  section: string;
  feedbackSubmitted: boolean;
}

export interface FeedbackPayload {
  courseId: string;
  facultyId: string;
  ratings: { questionId: string; score: number }[];
  remark?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/student`;

  getAvailableCourses(): Observable<{ success: boolean; data: { courses: CourseAssignment[] } }> {
    return this.http.get<any>(`${this.API}/courses`, { withCredentials: true });
  }

  submitFeedback(payload: FeedbackPayload): Observable<any> {
    return this.http.post<any>(`${this.API}/feedback`, payload, { withCredentials: true });
  }

  getSubmissionStatus(): Observable<any> {
    return this.http.get<any>(`${this.API}/feedback/status`, { withCredentials: true });
  }
}
