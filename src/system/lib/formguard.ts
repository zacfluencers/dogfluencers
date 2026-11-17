/**
 * A signed "form started" time, as a second line of defence after the
 * honeypot. The page (or a small endpoint, for a page built in advance) puts
 * a token in a hidden field; the server checks it on submit:
 *
 * - missing or forged: posted without loading the form, which is how most
 *   bots work;
 * - too fast: sent within a few seconds of the form appearing, faster than a
 *   person can read and fill it;
 * - expired: the page sat open for over a day, so ask for a resend.
 *
 * The token is the start time and an HMAC of it, so it can't be made up or
 * backdated without the server's secret. Server-only.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const FORM_TOKEN_FIELD = 'form_started';

export type FormTokenCheck = 'ok' | 'missing' | 'forged' | 'too_fast' | 'expired';

const sign = (secret: string, time: string) => createHmac('sha256', secret).update(`form-started:${time}`).digest('base64url');

/** A token for a form shown now. */
export function issueFormToken(secret: string, now = Date.now()): string {
  const time = String(now);
  return `${time}.${sign(secret, time)}`;
}

export function checkFormToken(
  token: unknown,
  secret: string,
  { minMs = 3000, maxMs = 24 * 60 * 60 * 1000 }: { minMs?: number; maxMs?: number } = {},
  now = Date.now(),
): FormTokenCheck {
  if (typeof token !== 'string' || !token.includes('.')) return 'missing';
  const [time, mac] = token.split('.', 2);
  const expected = Buffer.from(sign(secret, time));
  const given = Buffer.from(mac ?? '');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'forged';
  const age = now - Number(time);
  if (!Number.isFinite(age) || age < minMs) return 'too_fast';
  if (age > maxMs) return 'expired';
  return 'ok';
}
