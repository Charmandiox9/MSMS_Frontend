import { useEffect, useState, type RefObject } from "react";
import { apiFetch } from "@/lib/api";
import type { JustificationInboxEntry } from "@/types/justifications";

const REFRESH_INTERVAL = 30_000;

export function useInboxAutoRefresh({
  enabled,
  revision,
  onRefresh,
}: {
  enabled: boolean;
  revision: RefObject<number>;
  onRefresh: (incoming: JustificationInboxEntry[]) => void;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (document.visibilityState === "hidden" || controller) return;
      const request = new AbortController();
      controller = request;
      const requestRevision = revision.current;
      try {
        const incoming = await apiFetch<JustificationInboxEntry[]>(
          "/justifications/inbox",
          { signal: request.signal, cache: "no-store" },
        );
        // Do not restore an entry opened after this request started.
        if (
          !active ||
          request.signal.aborted ||
          requestRevision !== revision.current
        )
          return;
        onRefresh(incoming);
        setFailed(false);
      } catch {
        if (active && !request.signal.aborted) setFailed(true);
      } finally {
        controller = null;
      }
    };
    const onReturn = () => {
      void refresh();
    };
    const interval = window.setInterval(onReturn, REFRESH_INTERVAL);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [enabled, revision, onRefresh]);
  return failed;
}
