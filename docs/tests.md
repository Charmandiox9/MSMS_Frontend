# Pruebas del frontend (unitarias, integración y E2E)

Informe de las pruebas funcionales, de permisos y de carga de archivos del frontend de MARSYS. Es la continuación de las pruebas del backend (`MSMS_Backend/docs/tests.md`).

- **Rama:** `justifications` (base `71b3f53`).
- **Fecha de ejecución:** 27/09/2026.
- **Entorno:** Node 24, Next.js 16.3.1, React 19.2, Vitest 4 + Testing Library (jsdom), Playwright 1.62.1 (Chromium).
- **Zona horaria de las pruebas:** `America/Santiago`, fija en Vitest y en Playwright, para que el resultado sea el mismo en local y en Jenkins.

## Resumen

| Nivel                    | Comando                                                     | Archivos        | Tests | Resultado                  |
| ------------------------ | ----------------------------------------------------------- | --------------- | ----- | -------------------------- |
| Unitarias e integración  | `npm test`                                                  | 30 (30 ✅)      | 157   | **157 pasan · 0 fallan**   |
| E2E (navegador real)     | `npm run test:e2e`                                          | 3 specs         | 21    | **21 pasan · 0 fallan**    |
| Lint                     | `npm run lint`                                              | —               | —     | ✅ 0 errores (5 avisos)    |
| Tipos y build            | `npx tsc --noEmit` · `npm run build`                        | —               | —     | ✅ Compila                 |

**Estado inicial:** había 14 archivos de test con 50 tests, todos en verde. El lint tenía **62 errores** y Jenkins solo ejecutaba `npm run lint`, así que el pipeline del frontend quedaba en rojo. Los tests no se ejecutaban en CI.

**Primera entrega (rol QA):**

- Unitarias: 141 tests, de los cuales **10 fallaban**.
- E2E: 21 tests, de los cuales **4 fallaban**.

Los que fallaban comprobaban comportamientos incorrectos a propósito. Después de las correcciones (rol developer) pasan todos: ver [Problemas encontrados y corrección](#problemas-encontrados-y-corrección).

**Estrés:** no se hizo en el frontend, por decisión del alcance. Las páginas del dashboard se renderizan en el navegador y la carga real la recibe el backend, que ya se midió con autocannon (ver el informe del backend).

## Cómo ejecutar

```bash
npm test               # unitarias e integración (Vitest)
npm run test:e2e       # E2E: compila el frontend, levanta un backend simulado y abre Chromium
npm run lint
```

Detalles de `npm run test:e2e`:

- **Qué levanta:**
  - `next build` + `next start` en el puerto `3100`, con `NEXT_PUBLIC_API_URL=http://localhost:3999/api/graphql`;
  - el backend simulado `e2e/fake-backend.mts` en el puerto `3999`.
- **Qué necesita:**
  - no usa base de datos, Redis, R2 ni Google;
  - usa el Chromium de Playwright 1.62.1. Si no está en la caché, se instala con `npx playwright install chromium`.
- **Qué deja:**
  - el build queda en `.next`, igual que `npm run build`;
  - los reportes quedan en `playwright-report/` y `test-results/` (ignorados por git).

Jenkins ahora ejecuta `npm run lint` y `npm run test`. Las E2E no se ejecutan en CI porque necesitan navegador.

## Infraestructura de pruebas

- **`src/test/fake-api.ts`**: reemplaza `fetch` por un backend en memoria.
  - Las rutas se declaran como `'MÉTODO /ruta'`.
  - Responde `/api/runtime-config` igual que la app real.
  - Guarda cada petición (método, ruta, query, cuerpo y `credentials`) para verificar qué se envió.
  - Así se prueban también `apiFetch` y el formateo de errores de Nest, sin mockear módulos de la app.
- **`src/test/render.tsx`**: `renderAs(ui, roles)` renderiza con los **textos reales de `messages/es.json`** y una sesión con esos roles. Si falta una clave de traducción o cambia un texto, el test lo detecta.
- **`src/test/fixtures.ts`**: justificaciones y entradas de bandeja de ejemplo. La fecha de inasistencia viene como medianoche UTC, igual que en el backend.
- **`e2e/fake-backend.mts`**: servidor HTTP con estado que replica el contrato del backend real:
  - cookie `token`, CORS con credenciales y RBAC por rol (con `SYSTEM_ADMIN` como bypass);
  - errores con formato Nest y `POST /auth/logout` público que limpia la cookie;
  - URLs firmadas de evidencia;
  - `POST /__reset` y `GET /__state`, para que cada test parta limpio y verifique lo que llegó al "servidor".
- **`e2e/support.ts`**: `loginAs(context, cuenta)` deja la cookie de sesión que emite el backend tras el login con Google. Además da por aceptado el banner de cookies, que cubre el menú de cuenta.

## Qué se probó

### Funcionales

- **Bandeja del coordinador** (`dashboard/justifications`):
  - carga de entrantes e historial con contadores;
  - abrir una entrante (`POST .../open`), que pasa al historial y abre el detalle;
  - fecha con día de la semana, bloques con horario y profesores del NRC;
  - aceptar (con categoría obligatoria) y rechazar (con motivo obligatorio, recortado);
  - decisión ya tomada por otra persona ("La justificación ya fue resuelta"): el modal sigue abierto y se muestra el aviso;
  - las resueltas no se pueden volver a decidir;
  - filtros por estado y errores del backend visibles.
- **Histórico de secretaría** (`dashboard/justifications/management`):
  - contadores por estado;
  - filtros por estado, motivo, búsqueda (alumno, asignatura, NRC) y rango de fechas;
  - paginación de 10 y estadísticas por mes, semana y motivo;
  - detalle en modo lectura.
- **Usuarios** (`dashboard/users`):
  - listado con búsqueda y filtro por rol en la query;
  - asignar y revocar roles, activar y desactivar cuentas;
  - eliminar, y el rechazo del backend cuando la cuenta tiene historial.
- **Académico:**
  - semestres: listar y activar, con validación del backend;
  - profesores: búsqueda por nombre, correo o NRC y paginación;
  - asignaturas: agrupación por NRC con su profesor y filtros por día y búsqueda.
- **Sesión y configuración:**
  - `apiFetch`: cookies, cabeceras, 204, errores de validación de Nest y respuestas que no son JSON;
  - `auth`: sesión, 401, backend caído y logout;
  - `runtime-config`: URL de runtime o de build, sin `/graphql`, con una sola consulta;
  - `GET /api/runtime-config`: sin caché y solo expone la URL pública;
  - layout del dashboard: "Verificando sesión…", redirección al login y rol activo.
- **Traducciones:**
  - español e inglés tienen las mismas claves;
  - los textos usan los mismos parámetros ICU en ambos idiomas;
  - no hay textos vacíos.
- **Regresión de componentes refactorizados:** `CookieConsent` (banner, aceptar, rechazar, preferencias, sin render en servidor), el modal de detalle (reinicia el formulario solo al cambiar de justificación) y `useMounted`.

### Permisos

- **Menú lateral por rol (E2E):** coordinación, secretaría, analista y administración ven solo sus módulos.
- **Acceso por URL directa:**
  - cada página protegida muestra "No tienes acceso a esta página." a los demás roles;
  - **no consulta la API**. Esto se verifica en unitarias sobre las 6 páginas y en E2E sobre la bandeja y usuarios.
- **Cambio de rol activo:** una cuenta con dos roles cambia de menú al cambiar de rol, y el rol se conserva al recargar.
- **Middleware** (unitarias y E2E):
  - el callback de OAuth solo redirige a `/dashboard…` o `/no-access` y rechaza redirecciones abiertas (`https://evil.test`, `//evil.test`, `javascript:`);
  - con cookie de sesión, `/login` lleva al dashboard, con o sin prefijo de idioma;
  - la API y los estáticos no pasan por el middleware.
- **Sesión inválida:** una cookie vencida, falsa o de una cuenta desactivada vuelve al login y se borra.

### Carga de archivos

- **CSV de profesores y de horarios:** se envía el contenido exacto del archivo, se recarga el listado al terminar y se muestra el error del backend (por ejemplo "Fila 2: correo inválido").
- **Evidencias:**
  - se pide la URL firmada (`GET /justifications/:id/evidence-url`);
  - se abre en una pestaña nueva con `noopener,noreferrer`; en E2E se verifica que `window.opener` es `null`;
  - se muestra el error si el almacenamiento no está disponible (503);
  - secretaría y coordinación pueden descargarla.

## Problemas encontrados y corrección

Se detectaron en la entrega de QA con tests que fallaban, y se corrigieron el 27/09/2026 (rol developer). Todos tienen tests que los cubren.

### 1. Jenkins en rojo por el lint (62 errores)

- **Problema:** `npm run lint` fallaba con 62 errores, así que el pipeline del frontend nunca pasaba.
  - 48 errores venían de `Math.random()` durante el render en `Hero3D`.
  - 10 venían de `setState` síncrono dentro de `useEffect`.
  - 4 eran imports sin usar.
- **Corrección, sin cambiar el comportamiento:**
  - `Hero3D`: la generación de partículas pasa a una función fuera del componente (`createParticles`).
  - Nuevo hook `useMounted` (`useSyncExternalStore`), que reemplaza el `setMounted(true)` en efectos de `Navbar`, `LoginPreferences` y `DashboardUserDial`.
  - `CookieConsent` lee el consentimiento guardado durante el render en el cliente.
  - El modal de detalle ajusta su formulario al cambiar de justificación, sin efecto.
  - Las cargas de las páginas (bandeja, histórico, semestres, profesores, asignaturas) se hacen con una cadena de promesas dentro del efecto, con cancelación al desmontar. Esto también evita actualizar una página que ya se cerró. Las recargas tras importar o activar usan un contador (`reloadKey`).
- **CI:** Jenkins ahora también ejecuta `npm run test`, como pedía el comentario del `Jenkinsfile`.
- **Resultado:** 0 errores. Quedan 5 avisos: `<img>` de avatares y dependencias de un efecto de animación en `DashboardUserDial`.

### 2. Fecha de inasistencia un día antes en el histórico de secretaría

- **Problema:** el backend guarda la fecha como medianoche UTC (`2026-09-15T00:00:00Z`). La página de gestión la formateaba en la hora local, así que en Chile se veía **14-09-2026**. Esto también afectaba:
  - al filtro Desde/Hasta, que excluía las inasistencias del mismo día;
  - a las estadísticas por mes: el 1 de septiembre se contaba en **agosto**.

  La bandeja del coordinador ya lo hacía bien.
- **Corrección:** se formatea en UTC y se filtra comparando el día calendario (`YYYY-MM-DD`).
- **Tests:** 3 unitarios y 1 E2E.

### 3. `/dashboard/users` sin control de rol en la interfaz

- **Problema:** cualquier rol que escribiera la URL veía la pantalla de administración de usuarios. El backend sí lo impedía con 403. Era la única página protegida sin control en la interfaz.
- **Corrección:** solo `SYSTEM_ADMIN` la ve. Los demás ven "No tienes acceso a esta página." y no se consulta la API (tampoco las precargas). Se agregó el texto en español e inglés.
- **Tests:** 3 unitarios y 1 E2E.

### 4. Cambios en usuarios aplicados aunque el backend los rechace

- **Problema:** en sonner 2, `toast.promise()` no devuelve una promesa sino `{ unwrap }`, así que `await toast.promise(...)` seguía de inmediato. Consecuencias:
  - Si el backend rechazaba la eliminación (cuenta con historial), la cuenta desaparecía de la lista y el diálogo se cerraba.
  - Un rol rechazado se mostraba como asignado.
  - La lista se recargaba **antes** de que el backend confirmara la operación. Podía traer datos viejos y pisar el cambio, por ejemplo un rol recién asignado que no aparecía.
  - El panel de precargas cerraba el formulario y borraba lo escrito aunque la creación fallara.
- **Corrección:** `toast.promise(...).unwrap()` en las 5 llamadas (3 en usuarios y 2 en precargas).
- **Tests:** 3 unitarios y 1 E2E.

### 5. Sesión inválida: pantalla pegada en "Verificando sesión…"

- **Problema:** con una cookie vencida, inválida o de una cuenta desactivada (el backend ahora revalida `isActive` en cada request):
  1. el backend respondía 401;
  2. el layout mandaba a `/login`;
  3. el middleware veía la cookie y devolvía a `/dashboard`.

  La persona quedaba bloqueada y la única salida era borrar las cookies a mano.
- **Corrección:** antes de ir al login, el layout llama a `POST /auth/logout`. Ese endpoint es público y borra la cookie aunque la sesión ya no sea válida.
- **Tests:** 1 unitario y 1 E2E.

## Observaciones sin corregir (fuera del alcance)

- **Analista sin vista de justificaciones:** `ACADEMIC_PROCESS_ANALYST` puede consultar `GET /justifications` en el backend, pero el frontend no le muestra ninguna vista. Es una decisión de producto.
- **Avisos de Next 16:**
  - la convención `middleware` está deprecada y se reemplaza por `proxy`;
  - `next start` avisa que con `output: 'standalone'` se debería usar `node .next/standalone/server.js`. Las E2E usan `next start` porque funciona igual.
- **5 avisos de lint:** `<img>` en avatares (Next sugiere `<Image />`) y dependencias del efecto de animación del menú de cuenta.

## Listado de tests

### E2E (Playwright, 21)

#### `e2e/auth.spec.ts` (11)

- ✅ sin sesión el dashboard redirige al login
- ✅ con sesión, /login lleva al dashboard
- ✅ el callback de OAuth no redirige fuera del sitio
- ✅ una sesión inválida o vencida vuelve al login y limpia la cookie
- ✅ el menú lateral de coordinator solo muestra sus módulos
- ✅ el menú lateral de secretary solo muestra sus módulos
- ✅ el menú lateral de analyst solo muestra sus módulos
- ✅ el menú lateral de admin solo muestra sus módulos
- ✅ secretaría no ve la bandeja del coordinador aunque escriba la URL
- ✅ secretaría no ve la administración de usuarios aunque escriba la URL
- ✅ cerrar sesión llama al backend y vuelve al inicio de sesión

#### `e2e/justifications.spec.ts` (6)

- ✅ coordinación › abre una entrante, la acepta y queda registrada en el backend
- ✅ coordinación › rechazar exige un motivo y lo notifica
- ✅ coordinación › abre la evidencia en una pestaña nueva con la URL firmada
- ✅ coordinación › las justificaciones resueltas no permiten volver a decidir
- ✅ secretaría › el histórico muestra la fecha real y filtra por día
- ✅ secretaría › secretaría descarga la evidencia de un registro

#### `e2e/users.spec.ts` (4)

- ✅ asigna un rol y la fila refleja lo que guardó el backend
- ✅ si el backend impide eliminar, la cuenta sigue en la lista
- ✅ elimina una cuenta sin historial
- ✅ una cuenta con dos roles cambia de menú y de páginas al cambiar de rol

### Unitarias e integración (Vitest, 157)

#### `src/app/[locale]/(dashboard)/dashboard/justifications/management/page.test.tsx` (11)

- ✅ JustificationsManagementPage (histórico para secretaría) › bloquea la vista y no consulta la API para TEACHING_SUPPORT_COORDINATOR
- ✅ JustificationsManagementPage (histórico para secretaría) › bloquea la vista y no consulta la API para ACADEMIC_PROCESS_ANALYST
- ✅ JustificationsManagementPage (histórico para secretaría) › carga el histórico para ACADEMIC_SECRETARY
- ✅ JustificationsManagementPage (histórico para secretaría) › carga el histórico para SYSTEM_ADMIN
- ✅ JustificationsManagementPage (histórico para secretaría) › muestra la fecha de inasistencia en el día que la ingresó el alumno
- ✅ JustificationsManagementPage (histórico para secretaría) › el filtro Desde/Hasta incluye las inasistencias del mismo día
- ✅ JustificationsManagementPage (histórico para secretaría) › agrupa las estadísticas por el mes real de la inasistencia
- ✅ JustificationsManagementPage (histórico para secretaría) › filtra por estado, motivo y búsqueda, y limpia los filtros
- ✅ JustificationsManagementPage (histórico para secretaría) › pagina de a 10 y vuelve a la primera página al filtrar
- ✅ JustificationsManagementPage (histórico para secretaría) › abre el detalle en modo lectura y permite abrir la evidencia
- ✅ JustificationsManagementPage (histórico para secretaría) › muestra el error del backend si falla la carga

#### `src/app/[locale]/(dashboard)/dashboard/justifications/page.test.tsx` (14)

- ✅ JustificationsPage (coordinación de apoyo docente) › bloquea la vista y no consulta la API para SYSTEM_ADMIN
- ✅ JustificationsPage (coordinación de apoyo docente) › bloquea la vista y no consulta la API para ACADEMIC_SECRETARY
- ✅ JustificationsPage (coordinación de apoyo docente) › bloquea la vista y no consulta la API para ACADEMIC_PROCESS_ANALYST
- ✅ JustificationsPage (coordinación de apoyo docente) › carga entrantes e historial con cookies y muestra los contadores
- ✅ JustificationsPage (coordinación de apoyo docente) › abrir una entrante la registra como pendiente y abre el detalle
- ✅ JustificationsPage (coordinación de apoyo docente) › muestra el error del backend si no se puede abrir la entrante
- ✅ JustificationsPage (coordinación de apoyo docente) › aceptar envía la decisión con la categoría y actualiza el historial
- ✅ JustificationsPage (coordinación de apoyo docente) › rechazar exige motivo y lo envía recortado
- ✅ JustificationsPage (coordinación de apoyo docente) › si otra persona ya resolvió la justificación, mantiene el modal y muestra el aviso
- ✅ JustificationsPage (coordinación de apoyo docente) › las resueltas se muestran sin controles de decisión
- ✅ JustificationsPage (coordinación de apoyo docente) › abre la evidencia en una pestaña nueva sin acceso a la ventana de origen
- ✅ JustificationsPage (coordinación de apoyo docente) › informa si la evidencia no está disponible
- ✅ JustificationsPage (coordinación de apoyo docente) › filtra el historial por estado
- ✅ JustificationsPage (coordinación de apoyo docente) › muestra el error de carga si el backend niega el acceso

#### `src/app/[locale]/(dashboard)/dashboard/settings/page.test.tsx` (5)

- ✅ SettingsPage (semestre activo) › bloquea la vista para TEACHING_SUPPORT_COORDINATOR
- ✅ SettingsPage (semestre activo) › bloquea la vista para ACADEMIC_PROCESS_ANALYST
- ✅ SettingsPage (semestre activo) › lista los semestres con sus fechas sin desfase horario
- ✅ SettingsPage (semestre activo) › activa un semestre y recarga la lista
- ✅ SettingsPage (semestre activo) › muestra el error de validación del backend al activar

#### `src/app/[locale]/(dashboard)/dashboard/subjects/page.test.tsx` (6)

- ✅ SubjectsPage (asignaturas y horarios) › bloquea la vista para TEACHING_SUPPORT_COORDINATOR
- ✅ SubjectsPage (asignaturas y horarios) › bloquea la vista para ACADEMIC_PROCESS_ANALYST
- ✅ SubjectsPage (asignaturas y horarios) › agrupa los horarios por NRC y asocia el profesor
- ✅ SubjectsPage (asignaturas y horarios) › filtra por día y búsqueda
- ✅ SubjectsPage (asignaturas y horarios) › importa el CSV de horarios y recarga
- ✅ SubjectsPage (asignaturas y horarios) › muestra el error del backend al importar

#### `src/app/[locale]/(dashboard)/dashboard/teachers/page.test.tsx` (5)

- ✅ TeachersPage (padrón de profesores) › bloquea la vista para TEACHING_SUPPORT_COORDINATOR
- ✅ TeachersPage (padrón de profesores) › bloquea la vista para ACADEMIC_PROCESS_ANALYST
- ✅ TeachersPage (padrón de profesores) › busca por nombre, correo o NRC y pagina de a 10
- ✅ TeachersPage (padrón de profesores) › importa el CSV enviando su contenido y recarga
- ✅ TeachersPage (padrón de profesores) › muestra el error del backend si el CSV es inválido

#### `src/app/[locale]/(dashboard)/dashboard/users/page.test.tsx` (10)

- ✅ UsersPage (administración de usuarios) › lista usuarios con búsqueda y filtro de rol en la consulta
- ✅ UsersPage (administración de usuarios) › no muestra la administración de usuarios ni consulta la API para ACADEMIC_SECRETARY
- ✅ UsersPage (administración de usuarios) › no muestra la administración de usuarios ni consulta la API para TEACHING_SUPPORT_COORDINATOR
- ✅ UsersPage (administración de usuarios) › no muestra la administración de usuarios ni consulta la API para ACADEMIC_PROCESS_ANALYST
- ✅ UsersPage (administración de usuarios) › asignar un rol lo muestra en la fila cuando el backend confirma
- ✅ UsersPage (administración de usuarios) › si el backend rechaza el rol, no lo muestra como asignado
- ✅ UsersPage (administración de usuarios) › desactivar una cuenta envía el nuevo estado
- ✅ UsersPage (administración de usuarios) › si el backend impide eliminar la cuenta, la mantiene en la lista y el diálogo abierto
- ✅ UsersPage (administración de usuarios) › eliminar una cuenta la quita de la lista tras confirmar
- ✅ UsersPage (administración de usuarios) › muestra el error de carga del backend

#### `src/app/[locale]/(dashboard)/layout.test.tsx` (6)

- ✅ DashboardLayout (sesión) › muestra "Verificando sesión…" y no renderiza el contenido mientras consulta
- ✅ DashboardLayout (sesión) › redirige al login si no hay sesión y nunca muestra el contenido
- ✅ DashboardLayout (sesión) › si la sesión es inválida, limpia la cookie antes de ir al login
- ✅ DashboardLayout (sesión) › redirige al login si el backend está caído
- ✅ DashboardLayout (sesión) › con sesión renderiza el dashboard con el rol activo
- ✅ DashboardLayout (sesión) › ignora un rol guardado que la sesión ya no tiene

#### `src/app/api/runtime-config/route.test.ts` (3)

- ✅ GET /api/runtime-config › entrega la URL de GraphQL del entorno sin caché
- ✅ GET /api/runtime-config › entrega null si la variable no está configurada
- ✅ GET /api/runtime-config › solo expone la URL pública, no otras variables del servidor

#### `src/components/behavior/SmoothScroll.test.tsx` (1)

- ✅ SmoothScroll › monta ReactLenis en root con respeto al reduced-motion

#### `src/components/dashboard/DashboardPageHeader.test.tsx` (2)

- ✅ DashboardPageHeader component › renders title, eyebrow, subtitle, badge, and actions
- ✅ DashboardPageHeader component › renders correctly with only title

#### `src/components/dashboard/DashboardUserDial.test.tsx` (2)

- ✅ DashboardUserDial › opens the navigation menu when the bottom sidebar avatar is clicked
- ✅ DashboardUserDial › keeps the menu visible when reduced motion is enabled

#### `src/components/dashboard/justifications/JustificationDetailModal.test.tsx` (7)

- ✅ JustificationDetailModal › no renderiza nada cerrado
- ✅ JustificationDetailModal › parte con la categoría ya registrada en la justificación
- ✅ JustificationDetailModal › al cambiar de justificación descarta lo escrito para la anterior
- ✅ JustificationDetailModal › conserva lo escrito mientras se revisa la misma justificación
- ✅ JustificationDetailModal › muestra "sin clase registrada" si no hay bloques
- ✅ JustificationDetailModal › muestra bloques desconocidos sin horario
- ✅ JustificationDetailModal › no ofrece decidir mientras se procesa otra decisión

#### `src/components/dashboard/justifications/JustificationStatusBadge.test.tsx` (4)

- ✅ JustificationStatusBadge › renders pending status correctly
- ✅ JustificationStatusBadge › renders accepted status correctly
- ✅ JustificationStatusBadge › renders rejected status correctly
- ✅ JustificationStatusBadge › renders unread status correctly

#### `src/components/dashboard/RoleSwitcher.test.tsx` (2)

- ✅ RoleSwitcher component › should render interactive dropdown when user has multiple roles
- ✅ RoleSwitcher component › should render only badge when user has a single role

#### `src/components/dashboard/UnderDevelopmentPlaceholder.test.tsx` (1)

- ✅ UnderDevelopmentPlaceholder component › renders module title, development badge, privacy notice, and back link

#### `src/components/providers/CookieConsent.test.tsx` (7)

- ✅ CookieConsent › no se renderiza en el servidor (evita diferencias de hidratación)
- ✅ CookieConsent › muestra el banner si no hay una decisión guardada
- ✅ CookieConsent › no muestra el banner si ya se decidió
- ✅ CookieConsent › vuelve a preguntar si lo guardado no es JSON válido
- ✅ CookieConsent › aceptar todas guarda el consentimiento y oculta el banner
- ✅ CookieConsent › rechazar no esenciales deja solo las necesarias
- ✅ CookieConsent › guarda las preferencias elegidas en el panel de configuración

#### `src/components/ui/Breadcrumbs.test.tsx` (4)

- ✅ Breadcrumbs component › renders root crumb on /dashboard route without duplicate dashboard text
- ✅ Breadcrumbs component › renders home icon and target crumb without duplicate Dashboard label on /dashboard/users
- ✅ Breadcrumbs component › marks the last crumb as current page
- ✅ Breadcrumbs component › omits unauthorized intermediate route for ACADEMIC_SECRETARY on justifications/management

#### `src/components/ui/LazySection.test.tsx` (5)

- ✅ LazySection › no genera el contenido hasta acercarse al viewport
- ✅ LazySection › genera el contenido al acercarse al viewport
- ✅ LazySection › usa el preMargin configurado en el observer
- ✅ LazySection › solo genera el contenido una vez
- ✅ LazySection › genera el contenido de inmediato si IntersectionObserver no existe

#### `src/components/ui/Modal.test.tsx` (6)

- ✅ Modal component › does not render when isOpen is false
- ✅ Modal component › renders content, title, and locks body scroll when open
- ✅ Modal component › calls onClose when close button is clicked
- ✅ Modal component › calls onClose on Escape key press
- ✅ Modal component › calls onClose when clicking backdrop, but not when clicking inside dialog
- ✅ Modal component › renders footer when provided

#### `src/components/ui/PaginationControls.test.tsx` (4)

- ✅ PaginationControls › renders null when totalPages is 1 or less
- ✅ PaginationControls › renders controls and handles page clicks
- ✅ PaginationControls › disables previous button on first page
- ✅ PaginationControls › disables next button on last page

#### `src/components/ui/ScrollReveal.test.tsx` (6)

- ✅ ScrollReveal › renderiza sus children
- ✅ ScrollReveal › oculta el contenido hasta que entra en el viewport
- ✅ ScrollReveal › anima con easeOutExpo al intersectar
- ✅ ScrollReveal › solo reproduce la animación una vez
- ✅ ScrollReveal › aplica stagger a los children
- ✅ ScrollReveal › respeta prefers-reduced-motion y no anima

#### `src/config/navigation.test.ts` (6)

- ✅ Navigation configuration and filtering › should include all sections for SYSTEM_ADMIN
- ✅ Navigation configuration and filtering › should expose academic settings but omit system administration for ACADEMIC_SECRETARY
- ✅ Navigation configuration and filtering › should provide analysis and relevant academic sections for ACADEMIC_PROCESS_ANALYST
- ✅ Navigation configuration and filtering › should provide workload and operational justifications for TEACHING_SUPPORT_COORDINATOR
- ✅ Navigation configuration and filtering › should only return public/unrestricted items when role is null
- ✅ Navigation configuration and filtering › should correctly evaluate isRouteAllowed for authorized and unauthorized roles

#### `src/context/ActiveRoleContext.test.tsx` (4)

- ✅ ActiveRoleContext › should initialize activeRole with the first role by default
- ✅ ActiveRoleContext › should restore saved role from localStorage when valid
- ✅ ActiveRoleContext › should update activeRole and persist to localStorage when setActiveRole is called
- ✅ ActiveRoleContext › should not change activeRole if an unauthorized role is passed

#### `src/hooks/useMounted.test.tsx` (2)

- ✅ useMounted › es false al renderizar en el servidor
- ✅ useMounted › es true en el cliente

#### `src/i18n/messages.test.ts` (3)

- ✅ traducciones › español e inglés tienen las mismas claves
- ✅ traducciones › los textos usan los mismos parámetros en ambos idiomas
- ✅ traducciones › no hay textos vacíos

#### `src/lib/api-error.test.ts` (3)

- ✅ formatApiErrorMessage › formats Nest validation errors without rendering objects as [object Object]
- ✅ formatApiErrorMessage › joins multiple string validation messages
- ✅ formatApiErrorMessage › uses the fallback when the response has no readable message

#### `src/lib/api.test.ts` (5)

- ✅ apiFetch › usa la URL de runtime, envía cookies y JSON
- ✅ apiFetch › devuelve undefined en 204
- ✅ apiFetch › convierte los errores de validación de Nest en un mensaje legible
- ✅ apiFetch › usa un mensaje genérico si el error no trae JSON
- ✅ apiFetch › falla sin llamar a la red si no hay URL configurada

#### `src/lib/auth.test.ts` (5)

- ✅ auth › arma la URL de login con Google desde la URL de build
- ✅ auth › devuelve la sesión activa usando cookies
- ✅ auth › devuelve null si la sesión expiró
- ✅ auth › devuelve null si el backend no responde
- ✅ auth › cierra sesión con POST y cookies

#### `src/lib/runtime-config.test.ts` (6)

- ✅ runtime-config › prefiere la URL entregada en runtime y le quita /graphql
- ✅ runtime-config › consulta /api/runtime-config una sola vez
- ✅ runtime-config › vuelve a la URL de build si la respuesta no es OK
- ✅ runtime-config › vuelve a la URL de build si la red falla
- ✅ runtime-config › vuelve a la URL de build si runtime no trae URL
- ✅ runtime-config › expone la URL de build para el login con Google

#### `src/middleware.test.ts` (12)

- ✅ middleware › el callback de OAuth redirige /es/auth/callback?route=/dashboard/justifications a /dashboard/justifications
- ✅ middleware › el callback de OAuth redirige /auth/callback?route=/no-access a /no-access
- ✅ middleware › el callback de OAuth redirige /auth/callback a /dashboard
- ✅ middleware › el callback no permite redirecciones abiertas (https://evil.test/dashboard)
- ✅ middleware › el callback no permite redirecciones abiertas (//evil.test/dashboard)
- ✅ middleware › el callback no permite redirecciones abiertas (/login)
- ✅ middleware › el callback no permite redirecciones abiertas (javascript:alert(1))
- ✅ middleware › con cookie de sesión, /login redirige al dashboard
- ✅ middleware › con cookie de sesión, /login redirige al dashboard
- ✅ middleware › con cookie de sesión, /login redirige al dashboard
- ✅ middleware › sin cookie deja pasar /login al middleware de idioma
- ✅ middleware › no intercepta la API ni los estáticos
