import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JustificationStatusBadge from './JustificationStatusBadge';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      unread: 'Sin leer',
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
    };
    return translations[key] ?? key;
  },
}));

describe('JustificationStatusBadge', () => {
  it('renders pending status correctly', () => {
    render(<JustificationStatusBadge status="PENDING" />);
    expect(screen.getByText('Pendiente')).toBeDefined();
  });

  it('renders accepted status correctly', () => {
    render(<JustificationStatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Aceptada')).toBeDefined();
  });

  it('renders rejected status correctly', () => {
    render(<JustificationStatusBadge status="REJECTED" />);
    expect(screen.getByText('Rechazada')).toBeDefined();
  });

  it('renders unread status correctly', () => {
    render(<JustificationStatusBadge status="UNREAD" />);
    expect(screen.getByText('Sin leer')).toBeDefined();
  });
});
