import { apiFetch } from "@/lib/api";
import type { PaginatedResponse } from "@/types/pagination";
import type { Teacher } from "@/types/justifications";

/** All teachers are needed to associate course schedules with their instructors. */
export async function fetchAllTeachers(): Promise<Teacher[]> {
  const first = await apiFetch<PaginatedResponse<Teacher>>(
    "/academic/teachers?page=1&pageSize=100",
  );
  const teachers = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const response = await apiFetch<PaginatedResponse<Teacher>>(
      `/academic/teachers?page=${page}&pageSize=100`,
    );
    teachers.push(...response.items);
  }
  return teachers;
}
