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
pnpm test
pnpm build
```

## Organización

- `src/app`: rutas de Next.js organizadas por idioma y área autenticada.
- `src/components`: componentes compartidos y vistas de dashboards.
- `src/i18n` y archivos de mensajes: configuración y traducciones.
- `src/lib`: clientes y utilidades compartidas, incluido Apollo Client.

Mantén los textos visibles traducidos en español e inglés, conserva los Server Components por defecto y añade componentes cliente solo cuando la interacción lo requiera.
