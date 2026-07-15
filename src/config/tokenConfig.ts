/**
 * Centralized token / cookie expiry configuration.
 *
 * Every token TTL (`expiresIn`) and cookie `Max-Age` in the app is sourced from
 * here so the values live in one place and are driven by environment variables.
 *
 * Each entry exposes:
 *   - `value`   : the raw string (e.g. "1h", "30d") for `jwt.sign({ expiresIn })`
 *   - `seconds` : the same duration in whole seconds, for cookie `Max-Age`
 */

import type { SignOptions } from "jsonwebtoken";

const UNIT_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

/**
 * Convert an expiry expression ("1h", "30d", "45", "10s") to whole seconds.
 * A bare number is treated as seconds. Returns 0 when it cannot be parsed.
 */
export function expiryToSeconds(value: string): number {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)$/i);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return Math.floor(amount * (UNIT_SECONDS[unit] ?? 0));
}

/** jwt's accepted `expiresIn` type (`number | ms.StringValue | undefined`). */
type ExpiresIn = SignOptions["expiresIn"];

export interface ExpiryConfig {
  /** Raw duration for jwt `expiresIn` (e.g. "1h"). */
  value: ExpiresIn;
  /** Duration in whole seconds, for cookie `Max-Age`. */
  seconds: number;
}

function fromEnv(raw: string | undefined, fallback: string): ExpiryConfig {
  const value = (raw ?? fallback).trim().replace(/^["']|["']$/g, "");
  const seconds = expiryToSeconds(value) || expiryToSeconds(fallback);
  // env values are plain strings; jwt narrows to a template-literal type.
  return { value: value as ExpiresIn, seconds };
}

export const tokenExpiry = {
  /** Short-lived access token (login/register/refresh reissue). */
  access: fromEnv(process.env.ACCESS_EXPIRE, "1h"),
  /** Long-lived refresh token. */
  refresh: fromEnv(process.env.REFRESH_EXPIRE, "30d"),
  /** SSO hand-off token. */
  sso: fromEnv(process.env.SSO_EXPIRE, "5m"),
  /** Short-lived token for external service calls. */
  externalAccess: fromEnv(process.env.EXTERNAL_ACCESS_EXPIRE, "10s"),
  /** Newsletter unsubscribe token. */
  unsubscribe: fromEnv(process.env.UNSUBSCRIBE_EXPIRE, "30d"),
};

/** express-session cookie Max-Age, in milliseconds. */
export const sessionMaxAgeMs =
  fromEnv(process.env.SESSION_MAX_AGE, "15m").seconds * 1000;
