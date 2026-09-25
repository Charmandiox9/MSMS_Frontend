import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardPageHeader from './DashboardPageHeader';

describe('DashboardPageHeader component', () => {
  it('renders title, eyebrow, subtitle, badge, and actions', () => {
    render(
      <DashboardPageHeader
        eyebrow="Sección Principal"
        title="Gestión de Datos"
        subtitle="Descripción de la sección"
        badge={<span data-testid="status-badge">Activo</span>}
        actions={<button type="button">Nuevo Registro</button>}
      />,
    );

    expect(screen.getByText('Sección Principal')).toBeDefined();
    expect(screen.getByText('Gestión de Datos')).toBeDefined();
    expect(screen.getByText('Descripción de la sección')).toBeDefined();
    expect(screen.getByTestId('status-badge')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Nuevo Registro' })).toBeDefined();
  });

  it('renders correctly with only title', () => {
    render(<DashboardPageHeader title="Título Simple" />);

    expect(screen.getByText('Título Simple')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
