import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  highlighted: boolean;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  highlighted,
}: StatCardProps) {
  const surface = `flex min-w-0 items-start gap-3 rounded-xl border px-4 py-4 ${
    highlighted
      ? "border-warning/40 bg-warning-surface"
      : "border-border bg-card"
  }`;
  const content = (
    <>
      <Icon
        className={`mt-0.5 size-5 shrink-0 ${highlighted ? "text-warning" : "text-primary"}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {href && <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />}
    </>
  );

  return href ? (
    <Link
      href={href}
      className={`${surface} hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
    >
      {content}
    </Link>
  ) : (
    <div className={surface}>{content}</div>
  );
}
