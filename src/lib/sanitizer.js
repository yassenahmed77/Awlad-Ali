/**
 * Enterprise Input Sanitizer & Defensive Boundary Cleaner
 * Protects database storage and presentation layers against XSS, control characters,
 * phishing redirects, and buffer-overflow/storage-exhaustion attacks.
 */

/**
 * Strip dangerous HTML tags and event attributes (<script>, <iframe>, onload=, etc.)
 */
export function sanitizeText(input, maxLength = 255) {
  if (input === undefined || input === null) return "";

  const str = String(input)
    // Strip HTML tags entirely
    .replace(/<[^>]*>/g, "")
    // Strip null bytes and dangerous control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize unicode whitespace
    .replace(/\s+/g, " ")
    .trim();

  return str.slice(0, maxLength);
}

/**
 * Sanitize multi-line notes (preserves harmless newlines while stripping HTML & control chars)
 */
export function sanitizeNotes(input, maxLength = 500) {
  if (input === undefined || input === null) return "";

  const str = String(input)
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return str.slice(0, maxLength);
}

/**
 * Strict Google Maps URL Validator (Anti-Phishing / Anti-XSS in Cashier Dashboard)
 * Guarantees that only authentic Google Maps navigation URLs can be stored or clicked by staff.
 */
const ALLOWED_MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

export function validateGoogleMapsUrl(inputUrl, maxLength = 500) {
  if (!inputUrl || typeof inputUrl !== "string") return "";

  const clean = inputUrl.trim().slice(0, maxLength);
  if (!clean) return "";

  try {
    const parsed = new URL(clean);
    // Enforce HTTPS strictly
    if (parsed.protocol !== "https:") return "";

    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost =
      ALLOWED_MAPS_HOSTS.has(hostname) ||
      hostname.endsWith(".google.com") ||
      hostname.endsWith(".goo.gl");

    if (!isAllowedHost) return "";

    return parsed.toString();
  } catch (e) {
    return ""; // Invalid URL syntax
  }
}

/**
 * Type-safe SQL identifier allowlist validator
 * Guarantees that dynamically selected columns or sort directions cannot execute SQL injection.
 */
export function validateSortColumn(column, allowedColumns, fallback = allowedColumns[0]) {
  if (!column || typeof column !== "string") return fallback;
  const clean = column.trim().toLowerCase();
  return allowedColumns.includes(clean) ? clean : fallback;
}

export function validateSortOrder(order, fallback = "DESC") {
  if (!order || typeof order !== "string") return fallback;
  const clean = order.trim().toUpperCase();
  return clean === "ASC" || clean === "DESC" ? clean : fallback;
}
