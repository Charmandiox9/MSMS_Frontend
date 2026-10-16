'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  totalItems?: number;
  className?: string;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  totalItems,
  className = '',
}: PaginationControlsProps) {
  const t = useTranslations('Pagination');

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {totalItems !== undefined
          ? t('summary', { page, totalPages, total: totalItems })
          : `${page} / ${totalPages}`}
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
