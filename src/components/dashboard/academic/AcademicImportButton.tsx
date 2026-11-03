import { FileUp, LoaderCircle } from "lucide-react";
import { academicSecondaryActionClass } from "./academicActionStyles";

export {
  academicPrimaryActionClass,
  academicSecondaryActionClass,
} from "./academicActionStyles";

export default function AcademicImportButton({
  label,
  onClick,
  disabled = false,
  loading = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={academicSecondaryActionClass}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileUp className="h-4 w-4" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
