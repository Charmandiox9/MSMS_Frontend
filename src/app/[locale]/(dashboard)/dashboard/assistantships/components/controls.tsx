import type { ReactNode } from "react";
export const inputClass =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50";
export const primaryClass = `${buttonClass} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
