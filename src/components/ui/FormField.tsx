import type { ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {required && <span className="ml-1 text-coral-red">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-coral-red">
          {error}
        </p>
      )}
    </div>
  );
}
