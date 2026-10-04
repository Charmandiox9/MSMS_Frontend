/**
 * Backend MARSYS simulado para las pruebas E2E. Replica los contratos HTTP que
 * usa el frontend (cookies, CORS, RBAC por rol y errores con formato Nest) y
 * guarda estado en memoria. `POST /__reset` vuelve al estado inicial y
 * `GET /__state` permite a los tests verificar lo que llegó al "servidor".
 *
 * Se ejecuta con Node ≥ 22 (type stripping): `node e2e/fake-backend.mts`.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const PORT = Number(process.env.E2E_BACKEND_PORT ?? 3999);
const FRONTEND_ORIGIN = process.env.E2E_FRONTEND_ORIGIN ?? 'http://localhost:3100';

type Role = 'SYSTEM_ADMIN' | 'ACADEMIC_SECRETARY' | 'ACADEMIC_PROCESS_ANALYST' | 'TEACHING_SUPPORT_COORDINATOR';
type RoleRecord = { id: string; code: Role; name: string };
type Status = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type Json = Record<string, unknown>;

const ROLES: RoleRecord[] = [
  { id: 'r-admin', code: 'SYSTEM_ADMIN', name: 'Administrador del sistema' },
  { id: 'r-sec', code: 'ACADEMIC_SECRETARY', name: 'Secretaría académica' },
  { id: 'r-analyst', code: 'ACADEMIC_PROCESS_ANALYST', name: 'Analista de procesos' },
  { id: 'r-coord', code: 'TEACHING_SUPPORT_COORDINATOR', name: 'Coordinación de apoyo docente' },
];

const role = (code: Role) => ROLES.find((item) => item.code === code)!;

/** Cookie `token=<clave>` → cuenta. La clave hace de sesión opaca. */
const ACCOUNTS: Record<string, { id: string; name: string; email: string; roles: Role[] }> = {
  admin: { id: 'u-admin', name: 'Admin General', email: 'admin@ucn.cl', roles: ['SYSTEM_ADMIN'] },
  secretary: { id: 'u-sec', name: 'Sara Secretaria', email: 'secretaria@ucn.cl', roles: ['ACADEMIC_SECRETARY'] },
  coordinator: { id: 'u-coord', name: 'Coni Coordinadora', email: 'coordinacion@ucn.cl', roles: ['TEACHING_SUPPORT_COORDINATOR'] },
  analyst: { id: 'u-analyst', name: 'Andrés Analista', email: 'analista@ucn.cl', roles: ['ACADEMIC_PROCESS_ANALYST'] },
  multi: { id: 'u-multi', name: 'Mía Multirol', email: 'multirol@ucn.cl', roles: ['SYSTEM_ADMIN', 'TEACHING_SUPPORT_COORDINATOR'] },
};

function initialState() {
  return {
    inbox: [
      {
        id: 'inbox-1',
        externalResponseId: 'form-1',
        studentEmail: 'alumno1@alumnos.ucn.cl',
        absenceDate: '2026-09-15T00:00:00.000Z',
        subjectName: 'Cálculo I',
        subjectCode: 'MAT101',
        nrc: '1234',
        reason: 'Control médico programado',
        evidenceKey: 'justifications/forms/certificado.pdf',
        evidenceContentType: 'application/pdf',
        blocks: ['A', 'C2'],
        createdAt: '2026-09-15T12:00:00.000Z',
      },
    ] as Json[],
    justifications: [
      {
        id: 'j-accepted',
        sourceResponseId: 'form-0',
        studentEmail: 'alumno0@alumnos.ucn.cl',
        absenceDate: '2026-09-01T00:00:00.000Z',
        subjectName: 'Física II',
        subjectCode: 'FIS201',
        nrc: '5678',
        reasonCategory: 'MEDICAL',
        reason: null,
        evidenceKey: 'justifications/forms/antiguo.pdf',
        evidenceContentType: 'application/pdf',
        status: 'ACCEPTED' as Status,
        rejectionReason: null,
        blocks: ['B'],
        teachers: [{ name: 'Pedro Profesor', email: 'pedro@ucn.cl' }],
        openedAt: '2026-09-02T12:00:00.000Z',
        decidedAt: '2026-09-02T13:00:00.000Z',
        createdAt: '2026-09-02T12:00:00.000Z',
      },
    ] as Json[],
    users: [
      { id: 'u-1', name: 'Ana Pérez', email: 'ana@ucn.cl', avatarUrl: null, isActive: true, roles: [role('ACADEMIC_SECRETARY')], hasHistory: false },
      { id: 'u-2', name: 'Beto Soto', email: 'beto@ucn.cl', avatarUrl: null, isActive: true, roles: [role('TEACHING_SUPPORT_COORDINATOR')], hasHistory: true },
    ],
    decisions: [] as Json[],
  };
}

let state = initialState();

// RBAC igual al backend: SYSTEM_ADMIN pasa siempre.
const READERS: Role[] = ['ACADEMIC_SECRETARY', 'ACADEMIC_PROCESS_ANALYST', 'TEACHING_SUPPORT_COORDINATOR'];

function send(res: ServerResponse, status: number, body?: unknown) {
  if (status === 204) {
    res.writeHead(204).end();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body ?? null));
}

function error(res: ServerResponse, status: number, message: string | string[]) {
  const names: Record<number, string> = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict' };
  send(res, status, { statusCode: status, message, error: names[status] });
}

function cookie(req: IncomingMessage, name: string) {
  return req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function body(req: IncomingMessage): Promise<Json> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as Json) : {};
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return send(res, 204);

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (path === '/__reset' && method === 'POST') {
    state = initialState();
    return send(res, 204);
  }
  if (path === '/__state') return send(res, 200, state);
  if (path.startsWith('/evidence/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`evidencia ${path}`);
    return;
  }

  if (!path.startsWith('/api/')) return error(res, 404, 'Not Found');
  const route = path.slice('/api'.length);

  // Público, como en el backend: limpia la cookie aunque la sesión ya no sea válida.
  if (route === '/auth/logout' && method === 'POST') {
    res.setHeader('Set-Cookie', 'token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    return send(res, 204);
  }

  const account = ACCOUNTS[cookie(req, 'token') ?? ''];
  if (!account) return error(res, 401, 'Token no encontrado');

  const allow = (...roles: Role[]) => account.roles.some((code) => code === 'SYSTEM_ADMIN' || roles.includes(code));
  const forbid = () => error(res, 403, 'Forbidden resource');

  if (route === '/auth/session' && method === 'GET') {
    return send(res, 200, { email: account.email, roles: account.roles });
  }

  // Justificaciones
  if (route === '/justifications/inbox' && method === 'GET') {
    if (!allow('TEACHING_SUPPORT_COORDINATOR')) return forbid();
    return send(res, 200, state.inbox);
  }
  let match = route.match(/^\/justifications\/inbox\/([^/]+)\/open$/);
  if (match && method === 'POST') {
    if (!allow('TEACHING_SUPPORT_COORDINATOR')) return forbid();
    const entry = state.inbox.find((item) => item.id === match![1]);
    if (!entry) return error(res, 404, 'Entrada de formulario no encontrada');
    const justification: Json = {
      ...entry,
      id: `j-${entry.id}`,
      sourceResponseId: entry.externalResponseId,
      status: 'PENDING',
      rejectionReason: null,
      reasonCategory: null,
      teachers: [{ name: 'Ana Profesora', email: 'ana.profesora@ucn.cl' }],
      openedAt: new Date().toISOString(),
      decidedAt: null,
    };
    state.inbox = state.inbox.filter((item) => item !== entry);
    state.justifications.unshift(justification);
    return send(res, 201, justification);
  }
  if (route === '/justifications' && method === 'GET') {
    if (!allow(...READERS)) return forbid();
    const status = url.searchParams.get('status');
    return send(res, 200, status ? state.justifications.filter((item) => item.status === status) : state.justifications);
  }
  match = route.match(/^\/justifications\/([^/]+)\/decision$/);
  if (match && method === 'PATCH') {
    if (!allow('TEACHING_SUPPORT_COORDINATOR')) return forbid();
    const payload = await body(req);
    const item = state.justifications.find((candidate) => candidate.id === match![1]);
    if (!item) return error(res, 404, 'Justificación no encontrada');
    if (item.status !== 'PENDING') return error(res, 400, 'La justificación ya fue resuelta');
    if (payload.status === 'REJECTED' && !String(payload.rejectionReason ?? '').trim()) {
      return error(res, 400, 'Indica el motivo del rechazo');
    }
    Object.assign(item, {
      status: payload.status,
      reasonCategory: payload.reasonCategory,
      rejectionReason: payload.status === 'REJECTED' ? payload.rejectionReason : null,
      decidedAt: new Date().toISOString(),
    });
    state.decisions.push({ id: item.id, by: account.email, ...payload });
    return send(res, 200, item);
  }
  match = route.match(/^\/justifications\/([^/]+)\/evidence-url$/);
  if (match && method === 'GET') {
    if (!allow('ACADEMIC_SECRETARY', 'TEACHING_SUPPORT_COORDINATOR')) return forbid();
    const item = state.justifications.find((candidate) => candidate.id === match![1]);
    if (!item) return error(res, 404, 'Justificación no encontrada');
    return send(res, 200, {
      downloadUrl: `http://localhost:${PORT}/evidence/${String(item.evidenceKey)}?X-Amz-Signature=e2e`,
      expiresIn: 300,
    });
  }

  // Académico
  if (route === '/academic/semesters' && method === 'GET') {
    if (!allow(...READERS)) return forbid();
    return send(res, 200, [{ id: 's-1', name: '2026-2', startsOn: '2026-08-03T00:00:00.000Z', endsOn: '2026-12-11T00:00:00.000Z', isActive: true }]);
  }
  if (route === '/academic/teachers' && method === 'GET') {
    if (!allow(...READERS)) return forbid();
    return send(res, 200, []);
  }
  if (route === '/academic/courses' && method === 'GET') {
    if (!allow(...READERS)) return forbid();
    return send(res, 200, []);
  }

  // Usuarios (solo SYSTEM_ADMIN)
  if (route.startsWith('/users')) {
    if (!allow()) return forbid();
    if (route === '/users/preloads' && method === 'GET') return send(res, 200, { items: [] });
    if (route === '/users' && method === 'GET') {
      const items = state.users.map((user) => ({
        id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, isActive: user.isActive, roles: user.roles,
      }));
      return send(res, 200, { items, roles: ROLES, total: items.length, page: 1, pageSize: 10, totalPages: 1 });
    }
    match = route.match(/^\/users\/([^/]+)\/roles$/);
    if (match && method === 'POST') {
      const { roleId } = await body(req);
      const user = state.users.find((candidate) => candidate.id === match![1]);
      const assigned = ROLES.find((candidate) => candidate.id === roleId);
      if (!user || !assigned) return error(res, 404, 'Usuario o rol no encontrado');
      if (user.roles.some((candidate) => candidate.id === assigned.id)) return error(res, 400, 'El rol ya está asignado');
      user.roles = [...user.roles, assigned];
      return send(res, 201, {});
    }
    match = route.match(/^\/users\/([^/]+)$/);
    if (match && method === 'DELETE') {
      const user = state.users.find((candidate) => candidate.id === match![1]);
      if (!user) return error(res, 404, 'Usuario no encontrado');
      if (user.hasHistory) return error(res, 409, 'El usuario tiene historial académico y no puede eliminarse');
      state.users = state.users.filter((candidate) => candidate !== user);
      return send(res, 204);
    }
  }

  return error(res, 404, `Cannot ${method} ${path}`);
});

server.listen(PORT, 'localhost', () => {
  console.log(`Backend E2E simulado en http://localhost:${PORT}`);
});
