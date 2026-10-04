import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CookieConsent from './CookieConsent';
import { IntlProvider } from '@/test/render';

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const KEY = 'marsys_cookie_consent';

function renderConsent() {
  return render(
    <IntlProvider>
      <CookieConsent />
    </IntlProvider>,
  );
}

function saved() {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null');
}

describe('CookieConsent', () => {
  beforeEach(() => localStorage.clear());

  it('no se renderiza en el servidor (evita diferencias de hidratación)', () => {
    const html = renderToString(
      <IntlProvider>
        <CookieConsent />
      </IntlProvider>,
    );

    expect(html).not.toContain('Aceptar todas');
  });

  it('muestra el banner si no hay una decisión guardada', () => {
    renderConsent();

    expect(screen.getByRole('button', { name: 'Aceptar todas' })).toBeDefined();
  });

  it('no muestra el banner si ya se decidió', () => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: false, marketing: false }));
    renderConsent();

    expect(screen.queryByRole('button', { name: 'Aceptar todas' })).toBeNull();
  });

  it('vuelve a preguntar si lo guardado no es JSON válido', () => {
    localStorage.setItem(KEY, 'aceptado');
    renderConsent();

    expect(screen.getByRole('button', { name: 'Aceptar todas' })).toBeDefined();
  });

  it('aceptar todas guarda el consentimiento y oculta el banner', () => {
    renderConsent();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar todas' }));

    expect(saved()).toEqual({ necessary: true, analytics: true, marketing: true });
    expect(screen.queryByRole('button', { name: 'Aceptar todas' })).toBeNull();
  });

  it('rechazar no esenciales deja solo las necesarias', () => {
    renderConsent();
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar no esenciales' }));

    expect(saved()).toEqual({ necessary: true, analytics: false, marketing: false });
  });

  it('guarda las preferencias elegidas en el panel de configuración', () => {
    renderConsent();
    fireEvent.click(screen.getByRole('button', { name: 'Configurar cookies' }));
    expect(screen.getByText('Preferencias de Privacidad')).toBeDefined();

    const [analytics] = screen.getAllByRole('checkbox').filter((box) => !(box as HTMLInputElement).disabled);
    fireEvent.click(analytics);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preferencias' }));

    expect(saved()).toEqual({ necessary: true, analytics: true, marketing: false });
    expect(screen.queryByText('Preferencias de Privacidad')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Aceptar todas' })).toBeNull();
  });
});
