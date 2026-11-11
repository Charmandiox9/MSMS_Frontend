/** Canonical decimal strings use a dot, without grouping or floating point conversion. */
export function parseDecimalInput(value: string): string | null {
  let normalized = value.replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else normalized = normalized.replace(",", ".");
  return /^\d*(\.\d{0,2})?$/.test(normalized) ? normalized : null;
}

export function formatDecimalInput(value: string, locale: string): string {
  if (!value) return "";
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = parts.find((part) => part.type === "group")?.value ?? ",";
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  const [integer, fraction] = value.split(".");
  return (
    (integer || "0").replace(/\B(?=(\d{3})+(?!\d))/g, group) +
    (fraction !== undefined ? decimal + fraction : "")
  );
}
