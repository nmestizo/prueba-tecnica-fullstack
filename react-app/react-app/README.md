# Parte 3 – Lista de tareas en React

El componente `src/TaskList.tsx` "funciona a medias" y tiene errores.

## Cómo ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # verificación de tipos con TypeScript
```

El servidor de desarrollo incluye una **API simulada** (`mock/api.ts`, no es necesario modificarla):

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| GET | `/api/tasks?status=todo\|done` (vacío = todas) | – | `{ "data": Task[] }` |
| PATCH | `/api/tasks/:id` | JSON `{ "status": "todo" \| "done" }` | `{ "data": Task }` |

En caso de error la API responde con un código HTTP distinto de 2xx y `{ "error": string }`.

Como una API real, tiene latencia variable (algunas consultas son notablemente más lentas que otras) y algunas peticiones fallan.
Las peticiones recibidas se registran en la consola donde corre `npm run dev`.

## Tareas

1. Encontrar y corregir los errores.
2. Mostrar estados de carga y de error.
3. Evitar que una respuesta lenta de un filtro anterior sobrescriba la del filtro actual.
4. Extraer la lógica de datos a un hook `useTasks(status)`.
