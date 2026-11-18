# Prueba técnica: API de tareas en Node.js + TypeScript

Tienes que completar una API REST de tareas que guarda los datos en memoria. El código va en `src/`.

La plantilla ya incluye:

- `src/server.ts`: Express configurado (`express.json()`, ruta `/health`, router montado en `/tasks`). Exporta `app` para poder probarla con Supertest.
- `src/task.types.ts`: el tipo `Task`.
- `src/task.repository.ts`: un repositorio en memoria vacío.
- `src/tasks.router.ts`: un router de Express vacío.

## Puesta en marcha

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor con recarga en http://localhost:3000
npm test           # ejecuta los tests con Vitest
npm run typecheck  # comprobación de tipos con TypeScript
```

## Código de partida

```ts
// src/task.repository.ts
import type { Task } from './task.types.js';

export class TaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  // TODO: findAll, findById, create, update
}
```

```ts
// src/tasks.router.ts
import { Router } from 'express';

export const tasksRouter = Router();

// TODO: endpoints
```

## Requisitos

### `GET /tasks`

Devuelve la lista de tareas.

- Filtro opcional por estado: `?status=todo|doing|done`.
- Paginación: `?page=1&limit=10`. El valor máximo de `limit` es **50**.
- Respuesta:

```json
{ "data": [], "page": 1, "limit": 10, "total": 0 }
```

### `POST /tasks`

Crea una tarea.

- `title` es obligatorio y debe tener entre **3 y 100** caracteres.
- `priority` es opcional, admite valores de **1 a 3** y vale **2** por defecto.
- El `status` inicial es siempre `todo`.
- Responde **201** con la tarea creada.

### `PATCH /tasks/:id`

Actualiza `title`, `status` o `priority`.

- Responde **404** si la tarea no existe.
- Responde **400** si los datos no son válidos.
- **Regla de negocio:** una tarea en estado `done` no puede volver a `todo`.

### Manejo de errores

Los errores se gestionan en un único middleware de Express. Todas las respuestas de error tienen este formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

La respuesta **nunca** puede incluir un stack trace.

### Tests

Escribe al menos un test con **Vitest + Supertest** que compruebe que `POST /tasks` responde **400**. Ponlo en `test/`. Importa `app` desde `src/server.ts`: al ejecutar los tests no se abre ningún puerto.

## Puntos extra (perfil senior)

- Valida los datos con un esquema (Zod o similar) e infiere de él los tipos de TypeScript.
- Pon el repositorio detrás de una interfaz, de forma que se pueda sustituir por una base de datos.
- Ante la infracción de la regla de negocio, responde **409** en lugar de 400 y explica por qué.

## Entrega

- Puedes añadir las dependencias que necesites.
- Añade al final de este README una sección **Notas** con las decisiones que hayas tomado.
