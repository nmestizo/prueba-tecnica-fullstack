/**
 * API simulada (servidor de desarrollo de Vite). NO forma parte de la prueba:
 * no es necesario modificar este archivo.
 *
 *   GET   /api/tasks?status=todo|done   -> { data: Task[] }
 *   PATCH /api/tasks/:id                -> { data: Task }
 *         body JSON: { "status": "todo" | "done" }
 *         (como un servidor real, solo interpreta el body si llega
 *          con el header Content-Type: application/json)
 *
 * Comportamiento "realista":
 *   - Latencia variable. El filtro "todo" (Pendientes) responde más lento.
 *   - Un porcentaje de peticiones falla con HTTP 500.
 *
 * Variables de entorno opcionales:
 *   MOCK_ERROR_RATE  (0..1, por defecto 0.15)
 *   MOCK_SLOW_MS     (latencia extra del filtro "todo", por defecto 2500)
 */
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Status = 'todo' | 'done';
interface Task {
  id: number;
  title: string;
  status: Status;
}

const ERROR_RATE = Number(process.env.MOCK_ERROR_RATE ?? 0.15);
const SLOW_MS = Number(process.env.MOCK_SLOW_MS ?? 2500);

const tasks: Task[] = [
  { id: 1, title: 'Configurar el repositorio', status: 'done' },
  { id: 2, title: 'Diseñar el modelo de datos', status: 'done' },
  { id: 3, title: 'Crear endpoint de tareas', status: 'todo' },
  { id: 4, title: 'Escribir pruebas unitarias', status: 'todo' },
  { id: 5, title: 'Revisar accesibilidad', status: 'todo' },
  { id: 6, title: 'Documentar la API', status: 'todo' },
  { id: 7, title: 'Desplegar en staging', status: 'todo' },
];

let requestCount = 0;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.floor(Math.random() * (max - min));

function send(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

export function mockApi(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api/tasks', async (req, res) => {
        const n = ++requestCount;
        const url = new URL(req.url ?? '/', 'http://localhost');
        const path = url.pathname.replace(/\/+$/, '');
        const fullUrl = (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url;
        const log = (msg: string) => console.log(`[mock-api #${n}] ${req.method} ${fullUrl} -> ${msg}`);

        try {
          // ---- GET /api/tasks?status=...
          if (req.method === 'GET' && path === '') {
            const status = url.searchParams.get('status') ?? '';
            await sleep(status === 'todo' ? SLOW_MS + jitter(0, 500) : jitter(200, 700));

            if (Math.random() < ERROR_RATE) {
              log('500');
              return send(res, 500, { error: 'Error interno del servidor' });
            }
            if (status && status !== 'todo' && status !== 'done') {
              log('400');
              return send(res, 400, { error: `Estado inválido: ${status}` });
            }
            const data = status ? tasks.filter(t => t.status === status) : tasks;
            log(`200 (${data.length} tareas)`);
            return send(res, 200, { data });
          }

          // ---- PATCH /api/tasks/:id
          const m = path.match(/^\/(\d+)$/);
          if (req.method === 'PATCH' && m) {
            const raw = await readBody(req);
            await sleep(jitter(200, 600));

            const task = tasks.find(t => t.id === Number(m[1]));
            if (!task) {
              log('404');
              return send(res, 404, { error: 'Tarea no encontrada' });
            }
            if (Math.random() < ERROR_RATE) {
              log('500');
              return send(res, 500, { error: 'Error interno del servidor' });
            }

            // Igual que express.json(): sin Content-Type JSON el body se ignora.
            const isJson = (req.headers['content-type'] ?? '').includes('application/json');
            let body: { status?: unknown } = {};
            if (isJson) {
              try {
                body = JSON.parse(raw || '{}');
              } catch {
                log('400 (JSON inválido)');
                return send(res, 400, { error: 'JSON inválido' });
              }
            }
            if (body.status !== 'todo' && body.status !== 'done') {
              log('400 (status requerido)');
              return send(res, 400, { error: 'El campo "status" es requerido (todo | done)' });
            }

            task.status = body.status;
            log(`200 (tarea ${task.id} -> ${task.status})`);
            return send(res, 200, { data: task });
          }

          log('404');
          send(res, 404, { error: 'Ruta no encontrada' });
        } catch (e) {
          log('500 (excepción)');
          send(res, 500, { error: String(e) });
        }
      });
    },
  };
}
