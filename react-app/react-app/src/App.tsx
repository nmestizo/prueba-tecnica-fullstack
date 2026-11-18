import { TaskList } from './TaskList';

export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Lista de tareas</h1>
      <TaskList />
    </main>
  );
}
