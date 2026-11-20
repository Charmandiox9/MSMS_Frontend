export interface FilterTabOption<Value extends string> {
  value: Value;
  label: string;
  count?: number;
}

export default function FilterTabs<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly FilterTabOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`inline-flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-muted ${option.value === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          {option.label}{" "}
          {option.count !== undefined && (
            <span className="rounded-md bg-muted px-2 text-sm tabular-nums text-foreground">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
