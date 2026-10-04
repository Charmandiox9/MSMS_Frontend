import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ActiveRoleProvider } from '@/context/ActiveRoleContext';
import type { UserRoleCode } from '@/types/auth';
import es from '../../messages/es.json';

export const TEST_TIME_ZONE = 'America/Santiago';

export function IntlProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es" messages={es} timeZone={TEST_TIME_ZONE}>
      {children}
    </NextIntlClientProvider>
  );
}

/** Renderiza con los textos reales en español y la sesión del rol indicado. */
export function renderAs(ui: ReactElement, roles: UserRoleCode[] = []) {
  return render(
    <IntlProvider>
      <ActiveRoleProvider initialSession={{ email: 'usuario@ucn.cl', roles }}>{ui}</ActiveRoleProvider>
    </IntlProvider>,
  );
}
