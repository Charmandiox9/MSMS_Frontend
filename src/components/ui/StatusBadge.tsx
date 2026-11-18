import type { LucideIcon } from "lucide-react";

type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";
const tones: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-info/40 bg-info/10 text-info",
  warning: "border-warning/40 bg-warning/10 text-warning",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
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
