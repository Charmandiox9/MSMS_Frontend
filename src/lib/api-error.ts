function collectErrorMessages(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (typeof value !== 'object' || value === null) return [];

  const error = value as Record<string, unknown>;
  if (error.constraints && typeof error.constraints === 'object') {
    return Object.values(error.constraints).flatMap(collectErrorMessages);
  }
  if ('message' in error) return collectErrorMessages(error.message);

  return [];
}

export function formatApiErrorMessage(payload: unknown, fallback = 'No se pudo completar la solicitud'): string {
  const messages = collectErrorMessages(payload);
  return messages.length ? messages.join(' · ') : fallback;
}
