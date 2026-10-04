# MARSYS — Frontend

Interfaz web de MARSYS, plataforma académica construida con Next.js App Router, React, TypeScript y Tailwind CSS. La aplicación usa `next-intl` para español e inglés, Apollo Client para GraphQL y Sonner para notificaciones.

## Requisitos

- Node.js y pnpm.
- Backend MARSYS disponible, para las funciones que consultan datos.

## Instalación y configuración local

Desde esta carpeta:

```bash
pnpm install
```

Copia `.env.example` a `.env.development.local` y configura la URL GraphQL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/graphql
```

En despliegues con NGINX, puedes usar `/api/graphql` para que el proxy enrute las solicitudes. Las variables `NEXT_PUBLIC_*` se incluyen en el código del navegador; no coloques secretos en ellas.

## Ejecutar

```bash
# Servidor de desarrollo en http://localhost:3000
pnpm dev

# Compilación de producción y servidor local
pnpm build
pnpm start
```

El frontend depende de que las URLs configuradas apunten a servicios disponibles. Para autenticación, inicia también el backend y configura allí Google OAuth y el origen permitido del frontend.

## Comprobaciones

```bash
pnpm lint
pnpm test        # unitarias e integración (Vitest)
pnpm test:e2e    # E2E con Playwright contra un backend simulado
pnpm build
```

El detalle de qué cubren las pruebas y los problemas que detectaron está en [docs/tests.md](docs/tests.md).

## Organización

- `src/app`: rutas de Next.js organizadas por idioma y área autenticada.
- `src/components`: componentes compartidos y vistas de dashboards.
- `src/i18n` y archivos de mensajes: configuración y traducciones.
- `src/lib`: clientes y utilidades compartidas, incluido Apollo Client.

Mantén los textos visibles traducidos en español e inglés, conserva los Server Components por defecto y añade componentes cliente solo cuando la interacción lo requiera.

## Ayudantías

La ruta `/dashboard/assistantships` permite consultar registros por semestre,
buscar y filtrar por profesor/estado, y registrar ayudantías mediante un modal.
La ruta previa `/dashboard/assistantship-history` redirige a esta vista. El backend
debe exponer las consultas y la mutación del módulo GraphQL `assistantships`;
todas requieren el permiso `TEACHING_ASSISTANTS_MANAGE`.

Los tipos del contrato se generan desde `backend/src/schema.gql`, que NestJS
produce automáticamente al iniciar el backend:

```bash
npm run generate:assistantship-types
# También admite la ruta a un esquema exportado:
npm run generate:assistantship-types -- /ruta/al/schema.gql
```

Las pruebas del formulario y filtros usan Apollo MockedProvider. Ejecuta la suite
con Node 24 LTS para que jsdom gestione `localStorage`, sin interferencia de la
implementación experimental global de Node 25.
