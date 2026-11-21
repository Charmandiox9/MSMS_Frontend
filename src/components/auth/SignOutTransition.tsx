"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { logout } from "@/lib/auth";

export default function SignOutTransition({
  title,
  description,
  errorMessage,
  retryLabel,
}: {
  title: string;
  description: string;
  errorMessage: string;
  retryLabel: string;
}) {
  const router = useRouter();
  const automaticAttemptStarted = useRef(false);
  const requestInProgress = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(true);

  const finishSignOut = useCallback(async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;
    setHasError(false);
    setIsSigningOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch {
      setHasError(true);
    } finally {
      requestInProgress.current = false;
      setIsSigningOut(false);
    }
  }, [router]);

  useEffect(() => {
    if (automaticAttemptStarted.current) return;

    automaticAttemptStarted.current = true;
    void finishSignOut();
  }, [finishSignOut]);

  return (
    <main
      aria-busy={isSigningOut}
      className="institutional-theme flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center text-card-foreground shadow-sm sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-selection text-primary">
          {hasError ? (
            <CircleAlert aria-hidden="true" className="size-7 text-danger" />
          ) : (
            <LoaderCircle
              aria-hidden="true"
              className="size-7 animate-spin motion-reduce:animate-none"
            />
          )}
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          MARSYS · UCN
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {hasError && (
          <div className="mt-5 space-y-4" role="alert">
            <p className="text-sm font-medium text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void finishSignOut()}
              disabled={isSigningOut}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-wait disabled:opacity-70"
            >
              {isSigningOut && (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              )}
              {retryLabel}
            </button>
          </div>
        )}
        {!hasError && (
          <p role="status" className="sr-only">
            {description}
          </p>
        )}
      </section>
    </main>
  );
}
