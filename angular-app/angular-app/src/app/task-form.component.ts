import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Task, TaskService } from './task.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="title" />
      <select formControlName="priority">
        @for (p of priorities; track p ) { <option [ngValue]="p">{{ p }}</option> }
      </select>
      <p>Caracteres: {{ count }}</p>
      @if (serverError) { <p>{{ serverError }}</p> }
<button type="submit" [disabled]="loading">Guardar</button>
      @if (form.controls.title.touched && form.controls.title.errors) {
      @if (form.controls.title.errors['required']) { <p>El título es obligatorio.</p> }
      @if (form.controls.title.errors['minlength']) { <p>Mínimo 3 caracteres.</p> }
      @if (form.controls.title.errors['maxlength']) { <p>Máximo 100 caracteres.</p> }
}

    </form>
    @if (lastCreatedTask) {
  <p>Tarea creada: #{{ lastCreatedTask.id }} - {{ lastCreatedTask.title }} (Prioridad: {{ lastCreatedTask.priority }})</p>
}
  `,
})
export class TaskFormComponent implements OnInit {
  priorities = [1, 2, 3];
  count = 0;
  loading = false;
  serverError = '';
  lastCreatedTask: Task | null = null;

  form = new FormGroup({
    title: new FormControl('', this.trimmedLengthValidator(3, 100)),
    priority: new FormControl(2),
  });

  private taskService = inject(TaskService);
  private destroyRef = inject(DestroyRef);


  ngOnInit() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this.count = v?.length ?? 0;
      });
  }

  save() {
     if (this.loading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.serverError = '';

    const payload = {
      title: (this.form.value.title ?? '').trim(),
      priority: Number(this.form.value.priority ?? 2) as 1 | 2 | 3,
    };

    this.taskService.createTask(payload).subscribe({
      next: (task) => {
        this.lastCreatedTask = task;
        this.form.reset({ title: '', priority: 2 });
        this.loading = false;
      },
      error: (err) => {
        this.serverError = err.error?.error?.message ?? 'Error al guardar la tarea';
        this.loading = false;
      },
    });
  }

  // Validador que exige entre 3 y 100 caracteres reales (después de trim)
trimmedLengthValidator(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) {
      return { required: true };
    }
    if (value.length < min) {
      return { minlength: { requiredLength: min, actualLength: value.length } };
    }
    if (value.length > max) {
      return { maxlength: { requiredLength: max, actualLength: value.length } };
    }
    return null;
  };
}


}
