"use client";

import { useCallback, useEffect, useState } from "react";

const SEARCH_DELAY_MS = 300;

export function useSearchQuery(onCommit: () => void, delay = SEARCH_DELAY_MS) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const nextQuery = input.trim();
  const isWaiting = nextQuery !== query;

  useEffect(() => {
    if (!isWaiting) return;

    const timeout = window.setTimeout(() => {
      setQuery(nextQuery);
      onCommit();
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [delay, isWaiting, nextQuery, onCommit]);

  function change(value: string) {
    setInput(value);
    if (!value.trim() && query) {
      setQuery("");
      onCommit();
    }
  }

  const reset = useCallback(() => {
    setInput("");
    setQuery("");
  }, []);

  return { input, query, isWaiting, change, reset };
}
