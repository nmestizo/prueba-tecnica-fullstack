import express, { type NextFunction, type Request, type Response } from 'express';
import { tasksRouter } from './tasks.router.js';
import { AppError } from './app.error.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/tasks', tasksRouter);

// TODO: middleware de errores centralizado -> { error: { code, message } }
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Error de sintaxis en JSON malformado en el body
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({
      error: 'Invalid JSON payload',
    });
    return;
  }
})

const PORT = Number(process.env.PORT ?? 3000);

// Vitest define NODE_ENV=test: en los tests se importa `app` sin abrir el puerto.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}
