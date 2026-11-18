import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export type TaskPriority = 1 | 2 | 3;
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  priority: TaskPriority;
}

export interface PaginatedTasks {
  data: Task[];
  page: number;
  limit: number;
  total: number;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
   private readonly apiUrl = '/api/tasks';
lastCreatedTask: Task | null = null;

  getTasks(): Observable<PaginatedTasks> {
    return this.http.get<PaginatedTasks>(this.apiUrl);
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, dto).pipe(
      catchError((err: HttpErrorResponse) => {
        const apiError = err.error as ApiErrorResponse | undefined;
        const message =
          apiError?.error?.message ?? 'Error inesperado al crear la tarea.';
        return throwError(() => new Error(message));
      })
    );
  }
}
