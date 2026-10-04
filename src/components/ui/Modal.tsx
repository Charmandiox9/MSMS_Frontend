'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  closeLabel?: string;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  headerActions,
  children,
  footer,
  size = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  closeLabel = 'Cerrar ventana',
  ariaLabel,
  className = '',
  contentClassName = '',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) {
    return null;
  }

  const hasHeader = Boolean(title || eyebrow || headerActions || showCloseButton);

  return (
    <div
      data-lenis-prevent
      onClick={(event) => {
        if (event.target === event.currentTarget && closeOnBackdropClick) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={title ? 'modal-dialog-title' : undefined}
      aria-describedby={description ? 'modal-dialog-description' : undefined}
    >
      <div
        data-lenis-prevent
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl transition-all ${SIZE_CLASSES[size]} ${className}`}
      >
        {hasHeader && (
          <header className="flex items-start justify-between gap-4 border-b border-border p-5 md:p-6 shrink-0">
            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2
                  id="modal-dialog-title"
                  className="mt-1 text-xl md:text-2xl font-black text-foreground truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-dialog-description"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </header>
        )}

        <div
          data-lenis-prevent
          className={`flex-1 overflow-y-auto overscroll-contain p-5 md:p-6 ${contentClassName}`}
        >
          {children}
        </div>

        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-muted/20 p-4 md:p-5 shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
