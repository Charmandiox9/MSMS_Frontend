"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  preMargin?: number;
}

export default function LazySection({
  children,
  className = "",
  preMargin = 1000,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // Ajuste puntual de montaje en navegadores sin IntersectionObserver
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: `${preMargin}px 0px` }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [preMargin]);

  return (
    <div ref={ref} className={className}>
      {loaded ? children : null}
    </div>
  );
}
