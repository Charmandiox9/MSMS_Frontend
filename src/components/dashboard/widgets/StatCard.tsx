import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ocean-cyan/25 bg-ocean-cyan/10 text-ocean-cyan">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-black tracking-tight text-foreground">
          {value}
        </div>
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span
                className={`font-bold ${
                  trend.isPositive ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {trend.value}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
