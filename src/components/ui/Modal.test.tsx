import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

describe('Modal component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders content, title, and locks body scroll when open', () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Ventana de Prueba"
        eyebrow="Configuración"
        description="Descripción del modal"
      >
        <p>Cuerpo del diálogo</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Ventana de Prueba')).toBeDefined();
    expect(screen.getByText('Configuración')).toBeDefined();
    expect(screen.getByText('Descripción del modal')).toBeDefined();
    expect(screen.getByText('Cuerpo del diálogo')).toBeDefined();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeLabel="Cerrar modal">
        <p>Contenido</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Contenido</p>
      </Modal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop, but not when clicking inside dialog', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <button type="button">Botón interior</button>
      </Modal>,
    );

    fireEvent.click(screen.getByText('Botón interior'));
    expect(handleClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        footer={<button type="button">Guardar</button>}
      >
        <p>Contenido</p>
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDefined();
  });
});
