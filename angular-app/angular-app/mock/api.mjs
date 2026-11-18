/**
 * API simulada de tareas. NO forma parte de la prueba: no es necesario modificar este archivo.
 *
 * Reproduce el contrato de la API de tareas (Node.js + Express + Zod):
 *
 *   GET  /tasks          -> 200 { data: Task[], page, limit, total }
 *   POST /tasks          -> 201 Task
 *        body JSON: { "title": string, "priority"?: 1 | 2 | 3 }
 *          - title: obligatorio, se recorta (trim) y debe tener de 3 a 100 caracteres
 *          - priority: número entero 1, 2 o 3 (por defecto 2). Un string ("2") NO es válido.
 *          - cualquier otro campo se rechaza (esquema estricto)
 *
 *   Errores: código HTTP distinto de 2xx y { "error": { "code": string, "message": string } }
 *
 * El frontend la consume como /api/tasks gracias al proxy de `ng serve` (proxy.conf.json).
 *
 * Variables de entorno opcionales:
 *   MOCK_PORT        (por defecto 3000)
 *   MOCK_ERROR_RATE  (0..1, por defecto 0.15) probabilidad de 500 en un POST válido
 *   MOCK_DELAY_MS    (por defecto 1200) latencia aproximada del POST
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 3000);
const ERROR_RATE = Number(process.env.MOCK_ERROR_RATE ?? 0.15);
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 1200);

/** @type {Array<{id:number,title:string,status:'todo'|'doing'|'done',priority:1|2|3,createdAt:string,updatedAt:string}>} */
const tasks = [];
let nextId = 1;
let requestCount = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base) => Math.round(base * (0.7 + Math.random() * 0.6));

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

const fail = (res, code, errCode, message) => send(res, code, { error: { code: errCode, message } });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

const describe = (v) => (v === null ? 'null' : typeof v === 'string' ? `string "${v}"` : typeof v);

/** Valida como createTaskSchema (Zod strictObject). Devuelve la lista de problemas. */
function validateCreate(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { issues: ['El cuerpo debe ser un objeto JSON'] };
  }
  const issues = [];
  const unknown = Object.keys(body).filter((k) => k !== 'title' && k !== 'priority');
  if (unknown.length) issues.push(`Campos no permitidos: ${unknown.join(', ')}`);

  let title;
  if (typeof body.title !== 'string') {
    issues.push(`title: debe ser un string (se recibió ${describe(body.title)})`);
  } else {
    title = body.title.trim();
    if (title.length < 3) issues.push('title: title debe tener al menos 3 caracteres');
    if (title.length > 100) issues.push('title: title no puede superar 100 caracteres');
  }

  let priority = 2;
  if (body.priority !== undefined) {
    if (body.priority === 1 || body.priority === 2 || body.priority === 3) priority = body.priority;
    else issues.push(`priority: debe ser el número 1, 2 o 3 (se recibió ${describe(body.priority)})`);
  }
  return issues.length ? { issues } : { value: { title, priority } };
}

const server = createServer(async (req, res) => {
  const n = ++requestCount;
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  let bodyLog = '';
  const log = (msg) => console.log(`[mock-api #${n}] ${req.method} ${path}${bodyLog} -> ${msg}`);

  try {
    if (req.method === 'GET' && path === '/health') return send(res, 200, { status: 'ok' });

    if (req.method === 'GET' && path === '/tasks') {
      await sleep(jitter(300));
      log(`200 (${tasks.length} tareas)`);
      return send(res, 200, { data: tasks, page: 1, limit: tasks.length, total: tasks.length });
    }

    if (req.method === 'POST' && path === '/tasks') {
      const raw = await readBody(req);
      bodyLog = ` ${raw || '(sin body)'}`;
      await sleep(jitter(DELAY_MS));

      // Igual que express.json(): sin Content-Type JSON el body se ignora.
      const isJson = (req.headers['content-type'] ?? '').includes('application/json');
      let body = {};
      if (isJson && raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          log('400 INVALID_JSON');
          return fail(res, 400, 'INVALID_JSON', 'El cuerpo no es un JSON válido');
        }
      }

      const result = validateCreate(body);
      if (result.issues) {
        const message = result.issues.join('; ');
        log(`400 VALIDATION_ERROR (${message})`);
        return fail(res, 400, 'VALIDATION_ERROR', message);
      }

      if (Math.random() < ERROR_RATE) {
        log('500 INTERNAL_ERROR (simulado)');
        return fail(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
      }

      const now = new Date().toISOString();
      const task = { id: nextId++, ...result.value, status: 'todo', createdAt: now, updatedAt: now };
      tasks.push(task);
      log(`201 (tarea ${task.id} creada)`);
      return send(res, 201, task);
    }

    log('404');
    fail(res, 404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${path}`);
  } catch (e) {
    console.error(e);
    log('500 (excepción)');
    fail(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
  }
});

server.listen(PORT, () => {
  console.log(
    `[mock-api] escuchando en http://localhost:${PORT} (MOCK_ERROR_RATE=${ERROR_RATE}, MOCK_DELAY_MS=${DELAY_MS})`,
  );
});
