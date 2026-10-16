import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export default function Skeleton({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={twMerge(
        "rounded-lg bg-slate-200/80 motion-safe:animate-pulse dark:bg-slate-700/60",
        className,
      )}
    />
  );
}
