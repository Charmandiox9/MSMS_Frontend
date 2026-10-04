import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PaginationControls from './PaginationControls';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { page: number; totalPages: number; total: number }) => {
    if (key === 'summary' && values) {
      return `Página ${values.page} de ${values.totalPages} · ${values.total} registros`;
    }
    if (key === 'previous') return 'Página anterior';
    if (key === 'next') return 'Página siguiente';
    return key;
  },
}));

describe('PaginationControls', () => {
  it('renders null when totalPages is 1 or less', () => {
    const { container } = render(
      <PaginationControls page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders controls and handles page clicks', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        page={2}
        totalPages={5}
        totalItems={50}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText('Página 2 de 5 · 50 registros')).toBeDefined();

    const prevButton = screen.getByRole('button', { name: 'Página anterior' });
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);

    const nextButton = screen.getByRole('button', { name: 'Página siguiente' });
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    render(
      <PaginationControls page={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    const prevButton = screen.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('disables next button on last page', () => {
    render(
      <PaginationControls page={3} totalPages={3} onPageChange={vi.fn()} />,
    );
    const nextButton = screen.getByRole('button', { name: 'Página siguiente' }) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });
});
