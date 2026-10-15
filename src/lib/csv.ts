/** Quote cells and neutralize formulas before generating a spreadsheet download. */
export function createCsv(
  columns: string[],
  rows: Record<string, string | number | null>[],
  headers: string[] = columns,
) {
  const cell = (value: string | number | null) => {
    const text = String(value ?? "");
    const safe = /^\s*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      headers.map(cell).join(";"),
      ...rows.map((row) =>
        columns.map((column) => cell(row[column])).join(";"),
      ),
    ].join("\r\n")
  );
}
export function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
