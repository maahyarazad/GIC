/**
 * Returns `raw` only if it is a same-origin absolute path ("/foo?x=1"); otherwise null.
 * Rejects scheme-relative ("//host"), backslash tricks and control characters.
 */
export const sanitizeRedirect = (raw: string | null | undefined): string | null => {
  if (!raw || !raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  return raw;
};
