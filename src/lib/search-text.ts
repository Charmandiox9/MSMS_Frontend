const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function foldSearchText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

interface SearchMatch {
  start: number;
  end: number;
}

export function findSearchMatches(text: string, query: string): SearchMatch[] {
  const needle = foldSearchText(query.trim());
  if (!needle || !text) return [];

  const positions: SearchMatch[] = [];
  let foldedText = "";
  for (const { segment, index } of graphemes.segment(text)) {
    const folded = foldSearchText(segment);
    foldedText += folded;
    const position = { start: index, end: index + segment.length };
    for (let index = 0; index < folded.length; index += 1) positions.push(position);
  }

  const matches: SearchMatch[] = [];
  let cursor = 0;
  for (let index = foldedText.indexOf(needle); index >= 0; index = foldedText.indexOf(needle, cursor)) {
    cursor = index + needle.length;
    const start = positions[index].start;
    const end = positions[cursor - 1].end;
    if (start < (matches.at(-1)?.end ?? 0)) continue;
    matches.push({ start, end });
  }
  return matches;
}
