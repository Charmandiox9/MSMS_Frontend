import type { ReactNode } from 'react';

interface WidgetCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function WidgetCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: WidgetCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
