# Parte 4 – Formulario de tareas en Angular

El componente standalone `src/app/task-form.component.ts` crea tareas, pero tiene problemas de validación, suscripciones y tipado.
Hay que corregirlo y conectarlo correctamente a la API.

## Cómo ejecutar

Requiere Node.js 20.19+ (o 22.12+).

```bash
npm install
npm start          # API simulada (puerto 3000) + Angular en http://localhost:4200
npm run build      # compilación (detecta errores de plantilla y de tipos)
npm test           # pruebas unitarias (Vitest), si agregas alguna
```

`npm start` levanta dos procesos:

- **api**: API simulada (`mock/api.mjs`). No es necesario modificarla.
- **web**: `ng serve`, con un proxy (`proxy.conf.json`) que reenvía `/api/*` a `http://localhost:3000/*`.

Las peticiones que recibe la API se registran en la consola, con el body que llega.

## Contrato de la API

| Método | Ruta (desde Angular) | Body | Respuesta |
|---|---|---|---|
| POST | `/api/tasks` | JSON `{ "title": string, "priority"?: 1 \| 2 \| 3 }` | `201` con la `Task` creada |
| GET | `/api/tasks` | – | `{ "data": Task[], "page", "limit", "total" }` |

```ts
interface Task {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 1 | 2 | 3;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

Reglas de validación de `POST /tasks`:

- `title`: obligatorio. Se recorta (`trim`) y debe tener entre 3 y 100 caracteres.
- `priority`: número entero 1, 2 o 3 (por defecto 2).
- Cualquier otro campo se rechaza.

Si hay un error, la API responde con un código HTTP distinto de 2xx y este cuerpo: `{ "error": { "code": string, "message": string } }`.

Como una API real, tiene latencia (alrededor de 1 segundo por POST) y algunas peticiones fallan.

## Tareas

1. Corregir el error de compilación de la plantilla y el riesgo de `null` en `valueChanges`.
2. Agregar validación acorde a la API (obligatorio, 3 a 100 caracteres) y mostrar los mensajes de error solo cuando el campo fue tocado.
3. Asegurar que `priority` llegue a la API como número, no como string.
4. Evitar el doble envío, mostrar el error del servidor y limpiar el formulario al guardar.
5. Mover el `HttpClient` a un `TaskService` con `inject()` y métodos tipados.
