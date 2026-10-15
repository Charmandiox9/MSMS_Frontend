import type { ReactNode } from "react";
export const inputClass =
  "min-h-11 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-foreground outline-none transition-all hover:border-primary/50 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50 shadow-2xs";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted/80 hover:border-border active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 shadow-2xs cursor-pointer";
export const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-98 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
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
