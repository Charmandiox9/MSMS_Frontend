import type { LucideIcon } from "lucide-react";

type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";
const tones: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-info/40 bg-info-surface text-info",
  warning: "border-warning/40 bg-warning-surface text-warning",
  success: "border-success/40 bg-success-surface text-success",
  danger: "border-danger/40 bg-danger-surface text-danger",
};

export default function StatusBadge({
  label,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  icon: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${tones[tone]}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
