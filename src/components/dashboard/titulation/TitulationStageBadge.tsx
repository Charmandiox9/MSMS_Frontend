import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileSearch,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TitulationStage } from "./titulation-types";

const STAGE_PRESENTATION: Record<
  TitulationStage,
  { Icon: LucideIcon; className: string }
> = {
  UNCLASSIFIED: {
    Icon: CircleHelp,
    className: "border-border bg-muted text-muted-foreground",
  },
  INTAKE: {
    Icon: Clock3,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  REVIEW: {
    Icon: FileSearch,
    className: "border-info/40 bg-info/10 text-info",
  },
  DEFENSE: {
    Icon: GraduationCap,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  CLOSED: {
    Icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success",
  },
};

export default function TitulationStageBadge({
  stage,
  label,
}: {
  stage: TitulationStage;
  label: string;
}) {
  const { Icon, className } = STAGE_PRESENTATION[stage];

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
