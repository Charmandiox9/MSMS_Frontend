import { CircleHelp, Clock3, GraduationCap, CircleX } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import type { TitulationOutcome } from "./titulation-types";

export default function TitulationOutcomeBadge({
  outcome,
  label,
}: {
  outcome: TitulationOutcome;
  label: string;
}) {
  const icons = {
    UNCONFIRMED: CircleHelp,
    IN_PROGRESS: Clock3,
    GRADUATED: GraduationCap,
    NOT_GRADUATED: CircleX,
  };
  const tones = {
    UNCONFIRMED: "warning",
    IN_PROGRESS: "info",
    GRADUATED: "success",
    NOT_GRADUATED: "neutral",
  } as const;
  return (
    <StatusBadge label={label} icon={icons[outcome]} tone={tones[outcome]} />
  );
}
