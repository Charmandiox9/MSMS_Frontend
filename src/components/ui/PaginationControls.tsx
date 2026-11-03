'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  totalItems?: number;
  className?: string;
  summary?: ReactNode;
  variant?: 'default' | 'tableFooter';
  showSinglePage?: boolean;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  totalItems,
  className = '',
  summary,
  variant = 'default',
  showSinglePage = false,
}: PaginationControlsProps) {
  const t = useTranslations('Pagination');

  if (totalPages <= 1 && !showSinglePage) {
    return null;
  }

  const summaryContent = summary ?? (totalItems !== undefined
    ? t('summary', { page, totalPages, total: totalItems })
    : `${page} / ${totalPages}`);

  if (variant === 'tableFooter') {
    return (
      <footer
        className={`flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <p className="text-xs text-muted-foreground">{summaryContent}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t('previous')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-foreground">
            {page}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={t('next')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {summaryContent}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t('previous')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-xs font-bold text-foreground">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={t('next')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/50 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
