import { useEffect, useState } from 'react';
import type { Task } from './types';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);           // NUEVO
  const [error, setError] = useState<string | null>(null); // NUEVO

    useEffect(() => {

    const controller = new AbortController(); // NUEVO: cancela peticiones anteriores
    setLoading(true);                         // NUEVO
    setError(null);                           // NUEVO

    const url = status ? `/api/tasks?status=${status}` : '/api/tasks';
    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Error al cargar tareas');
        }
        return r.json();
      })
      .then((json) => setTasks(json.data))
      .catch((err) => {
        // NUEVO: ignora el error si fue porque cancelamos la petición al cambiar filtro
        if (err.name === 'AbortError') return;
        setError(err.message || 'Error inesperado');
      })
      .finally(() => {
        // NUEVO: solo apaga loading si esta petición sigue activa
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
      return () => controller.abort();
  }, [status]);

  function markDone(task: Task) {
     setError(null); // NUEVO: limpia errores previos al intentar actualizar
      fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Error al actualizar tarea');
        }
        return r.json();
      })
      .then((json) => {
        setTasks((prev) =>
          prev.map((t) => (t.id === json.data.id ? json.data : t))
        )
      })
      .catch((err) => {
        // NUEVO: muestra error si falla el PATCH
        setError(err.message || 'Error al actualizar tarea');
      });
  }

  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Todas</option>
        <option value="todo">Pendientes</option>
        <option value="done">Terminadas</option>
      </select>
         {/* NUEVO: mensajes de estado */}
      {loading && <p>Cargando tareas...</p>}
      {error && <p role="alert">Error: {error}</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title}
            {t.status !== 'done' && (
              <button onClick={() => markDone(t)}>Terminar</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}