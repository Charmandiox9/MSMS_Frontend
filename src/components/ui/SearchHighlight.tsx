import { Fragment } from "react";
import { findSearchMatches } from "@/lib/search-text";

export default function SearchHighlight({ text, query }: { text: string; query: string }) {
  const matches = findSearchMatches(text, query);
  if (matches.length === 0) return text;

  return (
    <>
      {matches.map(({ start, end }, index) => (
        <Fragment key={start}>
          {text.slice(matches[index - 1]?.end ?? 0, start)}
          <mark className="rounded-sm bg-primary/15 text-foreground">{text.slice(start, end)}</mark>
        </Fragment>
      ))}
      {text.slice(matches.at(-1)?.end)}
    </>
  );
}
