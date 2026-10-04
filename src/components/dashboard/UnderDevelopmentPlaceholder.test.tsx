import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UnderDevelopmentPlaceholder from './UnderDevelopmentPlaceholder';

vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      badge: 'Módulo en desarrollo',
      title: 'Sección planificada en la hoja de ruta',
      description: 'Esta funcionalidad se encuentra en fase de desarrollo.',
      privacyNotice: 'Cumple con Ley N° 21.719.',
      backToDashboard: 'Volver al panel principal',
    };
    return translations[key] ?? key;
  },
}));

describe('UnderDevelopmentPlaceholder component', () => {
  it('renders module title, development badge, privacy notice, and back link', () => {
    render(<UnderDevelopmentPlaceholder moduleTitle="Auditoría del sistema" />);

    expect(screen.getByText('Auditoría del sistema')).toBeDefined();
    expect(screen.getByText('Sección planificada en la hoja de ruta')).toBeDefined();
    expect(screen.getByText('Ley N° 21.719 & DevSecOps')).toBeDefined();
    expect(screen.getByText('Cumple con Ley N° 21.719.')).toBeDefined();

    const link = screen.getByRole('link', { name: 'Volver al panel principal' });
    expect(link.getAttribute('href')).toBe('/dashboard');
  });
});
