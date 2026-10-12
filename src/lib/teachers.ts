import { apiFetch } from "./api";
import type {
  Teacher,
  TeacherPage,
  TeacherSchedule,
} from "@/types/justifications";

/** Máximo que acepta el backend por página. */
export const TEACHERS_MAX_PAGE_SIZE = 100;

export interface TeachersQuery {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

/** Ruta de GET /academic/teachers; omite los filtros vacíos. */
export function teachersPath({ page, pageSize, search, isActive }: TeachersQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const term = search?.trim();
  if (term) params.set("search", term);
  if (isActive !== undefined) params.set("isActive", String(isActive));
  return `/academic/teachers?${params}`;
}

export function fetchTeachersPage<T = Teacher>(query: TeachersQuery) {
  return apiFetch<TeacherPage<T>>(teachersPath(query));
}

/** Recorre todas las páginas para vistas que necesitan el padrón completo. */
export async function fetchAllTeachers<T = Teacher>(): Promise<T[]> {
  const first = await fetchTeachersPage<T>({
    page: 1,
    pageSize: TEACHERS_MAX_PAGE_SIZE,
  });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      fetchTeachersPage<T>({
        page: index + 2,
        pageSize: TEACHERS_MAX_PAGE_SIZE,
      }),
    ),
  );
  return [first, ...rest].flatMap((result) => result.items);
}

/** Horario semanal del docente en el semestre activo. */
export function fetchTeacherSchedule(teacherId: string) {
  return apiFetch<TeacherSchedule>(
    `/academic/teachers/${encodeURIComponent(teacherId)}/schedule`,
  );
}
