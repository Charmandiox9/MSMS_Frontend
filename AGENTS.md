---
name: Frontend Next.js Guidelines - Ciencias del Mar
description: Reglas y convenciones para el desarrollo del frontend de la Facultad de Ciencias del Mar
trigger: always_on
---

# Reglas del Proyecto (Frontend - Next.js)

Todos los agentes de IA deben adherirse estrictamente a las siguientes reglas al trabajar en este frontend:

## 1. Tipado y TypeScript
- **Priorizar tipado estricto:** NUNCA usar `any`. Siempre definir interfaces (`interface`) o tipos (`type`) precisos para props, respuestas de API (GraphQL) y estados.
- Usar TypeScript en todos los archivos (`.ts`, `.tsx`).

## 2. Internacionalización (i18n)
- **Multi-idioma por defecto:** Toda nueva página, componente o edición sobre los existentes DEBE soportar múltiples idiomas (Inglés y Español) usando `next-intl`.
- No usar cadenas de texto "hardcodeadas" en los componentes. Siempre usar los diccionarios o funciones de traducción (ej. `t('clave')`).

## 3. Estilos y Tema (Dark/Light Mode)
- **Soporte de Tema:** Toda la UI debe soportar y verse bien tanto en **Modo Claro** (Light Mode) como en **Modo Oscuro** (Dark Mode). Usar las clases `dark:` de Tailwind CSS siempre que se asigne un color.
- Usar Tailwind CSS para todos los estilos. Evitar CSS customizado a menos que sea estrictamente necesario para animaciones complejas.

## 4. Paleta de Colores (Facultad de Ciencias del Mar)
La aplicación debe transmitir un aire académico, marítimo y profesional.

- **Primario (Océano Profundo):** Tonos azules oscuros (ej. `bg-blue-900` / `text-blue-900` para light, `blue-300` para dark). Representa la profundidad y la academia.
- **Secundario (Agua Marina):** Tonos turquesa/teal (ej. `teal-600`). Representa la flora/fauna marina y vitalidad.
- **Acento (Arena/Coral):** Tonos cálidos sutiles como `amber-500` (arena) o `rose-500` (coral) para botones de llamada a la acción o advertencias.
- **Fondos (Backgrounds):**
  - Light: Blancos o grises muy azulados (`slate-50`, `blue-50`).
  - Dark: Azules extremadamente oscuros, casi negros (`slate-950`, `blue-950`).

*Nota para Tailwind:* Debes configurar estos colores personalizados en el `tailwind.config.ts` o `globals.css` (usando variables CSS) antes de empezar el desarrollo visual.

## 5. Next.js App Router
- Mantener los Server Components como predeterminados. Solo usar `"use client"` cuando el componente requiera interactividad (hooks, onClick) o hooks de cliente de Apollo/Three.js.
- Organizar las rutas dentro de la carpeta `src/app`.

## 6. Integración API (GraphQL)
- Usar Apollo Client para todas las interacciones con el backend.
- Generar tipos automáticos a partir del schema de GraphQL cuando sea posible.

## 7. Flujo de Trabajo (Testing, Build y Commits)
- **Tests Unitarios Obligatorios:** Antes de finalizar cualquier nueva funcionalidad o componente, DEBES crear sus respectivos tests unitarios.
- **Verificación de Build:** Antes de hacer commit, DEBES comprobar que el proyecto compila correctamente ejecutando `npm run build`.
- **Commits Obligatorios:** Al terminar de implementar una funcionalidad, hacer los tests y comprobar el build, DEBES realizar el respectivo `git commit` y pushear los cambios. Nunca dejes trabajo terminado sin commitear.
