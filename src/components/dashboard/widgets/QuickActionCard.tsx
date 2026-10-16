import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export default function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-ocean-cyan/40 hover:bg-muted/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-cyan"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:border-ocean-cyan/40 group-hover:bg-ocean-cyan/15 group-hover:text-ocean-cyan">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ocean-cyan" />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-ocean-cyan">
          {title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
