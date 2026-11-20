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
        "rounded-lg bg-muted motion-safe:animate-pulse",
        className,
      )}
    />
  );
}
