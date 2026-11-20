import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileSearch,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { TitulationStage } from "./titulation-types";

const STAGE_PRESENTATION: Record<
  TitulationStage,
  { Icon: LucideIcon; tone: "neutral" | "info" | "warning" | "success" }
> = {
  UNCLASSIFIED: {
    Icon: CircleHelp,
    tone: "neutral",
  },
  INTAKE: {
    Icon: Clock3,
    tone: "warning",
  },
  REVIEW: {
    Icon: FileSearch,
    tone: "info",
  },
  DEFENSE: {
    Icon: GraduationCap,
    tone: "info",
  },
  CLOSED: {
    Icon: CheckCircle2,
    tone: "neutral",
  },
};

export default function TitulationStageBadge({
  stage,
  label,
}: {
  stage: TitulationStage;
  label: string;
}) {
  const { Icon, tone } = STAGE_PRESENTATION[stage];
  return <StatusBadge label={label} icon={Icon} tone={tone} />;
}
