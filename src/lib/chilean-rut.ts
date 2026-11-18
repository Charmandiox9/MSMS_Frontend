const groupDigits = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Formats a Chilean RUT progressively while preserving an optional verifier. */
export function formatChileanRut(value: string): string {
  const normalized = value.replace(/[.\s]/g, "").toLocaleUpperCase("es-CL");
  const dashIndex = normalized.indexOf("-");
  const explicitDash = dashIndex >= 0;
  let rawBody = explicitDash ? normalized.slice(0, dashIndex) : normalized;
  let rawVerifier = explicitDash ? normalized.slice(dashIndex + 1) : "";
  if (explicitDash && rawVerifier.replace(/[^0-9K]/g, "").length > 1) {
    const extended = `${rawBody.replace(/[^0-9K]/g, "")}${rawVerifier.replace(/[^0-9K]/g, "")}`;
    rawBody = extended.slice(0, -1);
    rawVerifier = extended.slice(-1);
  }
  const bodyCharacters = rawBody.replace(/[^0-9K]/g, "");
  const verifierInput = explicitDash
    ? rawVerifier.replace(/[^0-9K]/g, "").slice(0, 1)
    : bodyCharacters.endsWith("K")
      ? "K"
      : bodyCharacters.length >= 8
        ? bodyCharacters.slice(-1)
      : "";
  const rutBody = (explicitDash
    ? bodyCharacters
    : verifierInput
      ? bodyCharacters.slice(0, -1)
      : bodyCharacters).replace(/\D/g, "").slice(0, 8);
  const formattedBody = groupDigits(rutBody);
  if (explicitDash && !verifierInput) return `${formattedBody}-`;
  return verifierInput ? `${formattedBody}-${verifierInput}` : formattedBody;
}

/** Removes display punctuation before sending the RUT to the API. */
export function normalizeChileanRut(value: string): string {
  return value.replace(/[.\s]/g, "").toLocaleUpperCase("es-CL");
}

/** Validates a Chilean RUT without requiring display punctuation. */
export function isValidChileanRut(value: string): boolean {
  const normalized = normalizeChileanRut(value);
  const parts = normalized.match(/^(\d{7,8})-?([\dK])$/);
  if (!parts) return false;

  let factor = 2;
  let sum = 0;
  for (const digit of [...parts[1]].reverse()) {
    sum += Number(digit) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = 11 - (sum % 11);
  const verifier =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return parts[2] === verifier;
}
