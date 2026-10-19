"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

export interface AcademicImportJob<Result> {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  result?: Result | null;
  error?: string | null;
}

export function useAcademicImportJob<Result>(
  jobId: string | null,
  onStatus: (job: AcademicImportJob<Result>) => void,
  onCompleted: (result: Result) => void,
  onFailed: (error: string | null) => void,
) {
  const callbacks = useRef({ onStatus, onCompleted, onFailed });

  useEffect(() => {
    callbacks.current = { onStatus, onCompleted, onFailed };
  }, [onStatus, onCompleted, onFailed]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const job = await apiFetch<AcademicImportJob<Result>>(
          `/academic/imports/jobs/${jobId}`,
        );
        if (cancelled) return;
        callbacks.current.onStatus(job);
        if (job.status === "COMPLETED") {
          if (job.result) callbacks.current.onCompleted(job.result);
        } else if (job.status === "FAILED") {
          callbacks.current.onFailed(job.error ?? null);
        } else {
          timer = setTimeout(() => void poll(), 1_500);
        }
      } catch {
        if (!cancelled) timer = setTimeout(() => void poll(), 3_000);
      }
    };

    timer = setTimeout(() => void poll(), 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);
}
