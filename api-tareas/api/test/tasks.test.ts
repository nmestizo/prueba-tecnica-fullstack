import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/server.js';

describe('API de Tareas (/tasks)', () => {
  it('GET /health responde 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('POST /tasks crea una tarea con valores válidos y priority por defecto (2)', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Aprender TypeScript' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Aprender TypeScript',
      status: 'todo',
      priority: 2,
    });
  });

  it('POST /tasks falla con 400 si el título tiene menos de 3 o más de 100 caracteres', async () => {
    const shortRes = await request(app).post('/tasks').send({ title: 'ab' });
    expect(shortRes.status).toBe(400);

    const longRes = await request(app)
      .post('/tasks')
      .send({ title: 'a'.repeat(101) });
    expect(longRes.status).toBe(400);
  });

  it('POST /tasks falla con 400 si priority está fuera de rango (1-3)', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Tarea válida', priority: 5 });

    expect(res.status).toBe(400);
  });

  it('GET /tasks devuelve paginación y filtra por status', async () => {
    const res = await request(app).get('/tasks?status=todo&page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      page: 1,
      limit: 10,
    });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /tasks falla con 400 si limit supera 50', async () => {
    const res = await request(app).get('/tasks?limit=51');
    expect(res.status).toBe(400);
  });

  it('PATCH /tasks/:id actualiza estado y bloquea pasar de done a todo', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Tarea de prueba' });

    const id = created.body.id;

    const doneRes = await request(app)
      .patch(`/tasks/${id}`)
      .send({ status: 'done' });
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.status).toBe('done');

    const revertRes = await request(app)
      .patch(`/tasks/${id}`)
      .send({ status: 'todo' });
    expect(revertRes.status).toBe(400);
  });

  it('PATCH /tasks/:id devuelve 404 si la tarea no existe', async () => {
    const res = await request(app)
      .patch('/tasks/99999')
      .send({ title: 'Inexistente' });

    expect(res.status).toBe(404);
  });
});