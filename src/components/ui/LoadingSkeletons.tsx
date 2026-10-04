"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import Skeleton from "./Skeleton";

export function SkeletonStatus({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("Loading");
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label ?? t("content")}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function MetricSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-border bg-card shadow-sm ${compact ? "flex items-center gap-4 p-4" : "space-y-4 p-6"}`}
    >
      {compact ? (
        <>
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-40 max-w-full" />
        </>
      )}
    </div>
  );
}

export function MetricsSkeleton({
  count = 4,
  compact = false,
  className,
  label,
}: {
  count?: number;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  const t = useTranslations("Loading");
  return (
    <SkeletonStatus label={label ?? t("metrics")}>
      <div className={className ?? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}>
        {Array.from({ length: count }, (_, index) => (
          <MetricSkeleton key={index} compact={compact} />
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  label,
  className = "",
}: {
  rows?: number;
  columns?: 3 | 4 | 5 | 6;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("Loading");
  const grid = {
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  }[columns];
  return (
    <SkeletonStatus
      label={label ?? t("table")}
      className={`overflow-hidden rounded-2xl border border-border bg-card ${className}`}
    >
      <div
        className={`hidden gap-6 border-b border-border bg-muted/40 px-5 py-4 md:grid ${grid}`}
      >
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 w-20 max-w-full" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className={`grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5 ${grid}`}
          >
            {Array.from({ length: columns }, (_, column) => (
              <div key={column} className="min-w-0 space-y-2">
                <Skeleton
                  className={column === 0 ? "h-4 w-4/5" : "h-4 w-3/5"}
                />
                {column < 2 && <Skeleton className="h-3 w-1/2" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-6 border-t border-border px-5 py-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </SkeletonStatus>
  );
}

export function CardsSkeleton({
  count = 3,
  grid = false,
  label,
  className = "",
}: {
  count?: number;
  grid?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonStatus label={label} className={className}>
      <div className={grid ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function FormSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function AnalyticsSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="space-y-5 rounded-3xl border border-border bg-card p-5"
          >
            <Skeleton className="h-5 w-3/4" />
            {["w-full", "w-3/4", "w-1/2"].map((width) => (
              <div key={width} className="space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className={`h-2 ${width}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}

export function PageSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonStatus label={label}>
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <MetricSkeleton key={index} />
          ))}
        </div>
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-11 w-2/3" />
          <Skeleton className="h-11 w-1/3" />
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function DashboardShellSkeleton({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside
        aria-hidden="true"
        className="hidden w-64 shrink-0 space-y-6 border-r border-border bg-card p-6 lg:block"
      >
        <Skeleton className="h-10 w-36" />
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <div
          aria-hidden="true"
          className="flex h-20 items-center justify-between border-b border-border bg-card px-6"
        >
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <main className="p-5 md:p-8">
          <PageSkeleton label={label} />
        </main>
      </div>
    </div>
  );
}
