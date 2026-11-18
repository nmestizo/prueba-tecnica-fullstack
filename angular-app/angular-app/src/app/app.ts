import { Component } from '@angular/core';
import { TaskFormComponent } from './task-form.component';

@Component({
  selector: 'app-root',
  imports: [TaskFormComponent],
  template: `
    <main>
      <h1>Nueva tarea</h1>
      <app-task-form />
    </main>
  `,
})
export class App {}
