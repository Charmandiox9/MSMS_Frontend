import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import JustificationDetailModal from './JustificationDetailModal';
import { IntlProvider } from '@/test/render';
import { justification } from '@/test/fixtures';
import type { Justification } from '@/types/justifications';

function renderModal(item: Justification | null, props: Partial<Parameters<typeof JustificationDetailModal>[0]> = {}) {
  const onDecision = vi.fn(() => Promise.resolve());
  const view = render(
    <IntlProvider>
      <JustificationDetailModal item={item} isOpen={Boolean(item)} onClose={vi.fn()} onEvidence={vi.fn(() => Promise.resolve())} mode="decision" onDecision={onDecision} {...props} />
    </IntlProvider>,
  );
  const rerender = (next: Justification | null) =>
    view.rerender(
      <IntlProvider>
        <JustificationDetailModal item={next} isOpen={Boolean(next)} onClose={vi.fn()} onEvidence={vi.fn(() => Promise.resolve())} mode="decision" onDecision={onDecision} {...props} />
      </IntlProvider>,
    );
  return { onDecision, rerender };
}

const category = () => screen.getByLabelText('Motivo de la inasistencia') as HTMLSelectElement;
const rejection = () => screen.getByLabelText(/Motivo del rechazo/) as HTMLTextAreaElement;

describe('JustificationDetailModal', () => {
  it('no renderiza nada cerrado', () => {
    const { container } = render(
      <IntlProvider>
        <JustificationDetailModal item={null} isOpen={false} onClose={vi.fn()} onEvidence={vi.fn()} />
      </IntlProvider>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('parte con la categoría ya registrada en la justificación', () => {
    renderModal(justification({ reasonCategory: 'ACADEMIC' }));

    expect(category().value).toBe('ACADEMIC');
  });

  it('al cambiar de justificación descarta lo escrito para la anterior', () => {
    const { rerender } = renderModal(justification({ id: 'j-1' }));
    fireEvent.change(category(), { target: { value: 'MEDICAL' } });
    fireEvent.change(rejection(), { target: { value: 'Borrador para j-1' } });

    rerender(justification({ id: 'j-2', reasonCategory: 'PERSONAL' }));

    expect(category().value).toBe('PERSONAL');
    expect(rejection().value).toBe('');
  });

  it('conserva lo escrito mientras se revisa la misma justificación', () => {
    const item = justification();
    const { rerender } = renderModal(item);
    fireEvent.change(rejection(), { target: { value: 'Sigue aquí' } });

    rerender(item);

    expect(rejection().value).toBe('Sigue aquí');
  });

  it('muestra "sin clase registrada" si no hay bloques', () => {
    renderModal(justification({ blocks: [] }));
    expect(screen.getByText('Sin clase registrada para este día')).toBeDefined();
  });

  it('muestra bloques desconocidos sin horario', () => {
    renderModal(justification({ blocks: ['Z'] }));
    expect(screen.getByText('Bloque Z')).toBeDefined();
  });

  it('no ofrece decidir mientras se procesa otra decisión', () => {
    renderModal(justification({ reasonCategory: 'MEDICAL' }), { isProcessing: true });

    expect((screen.getByRole('button', { name: 'Aceptar' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
