import { describe, expect, it } from 'vitest';
import { formatApiErrorMessage } from './api-error';

describe('formatApiErrorMessage', () => {
  it('formats Nest validation errors without rendering objects as [object Object]', () => {
    expect(formatApiErrorMessage({ message: [{ property: 'roleId', constraints: { isUuid: 'roleId must be a UUID' } }] }))
      .toBe('roleId must be a UUID');
  });

  it('joins multiple string validation messages', () => {
    expect(formatApiErrorMessage({ message: ['roleId is required', 'roleId must be a UUID'] }))
      .toBe('roleId is required · roleId must be a UUID');
  });

  it('uses the fallback when the response has no readable message', () => {
    expect(formatApiErrorMessage({ message: [{ property: 'roleId' }] }, 'Request failed'))
      .toBe('Request failed');
  });
});
