/**
 * A fresh signed start time for a form on a page built in advance (the
 * campaign brief), fetched as the page opens. See system/lib/formguard.ts.
 */
import type { APIRoute } from 'astro';
import { issueFormToken } from '../../system/lib/formguard';

export const prerender = false;

const env = (name: string) => (import.meta.env[name] as string | undefined) || process.env[name];

export const GET: APIRoute = () => {
  const secret = env('FORM_SECRET') || env('CRON_SECRET');
  return Response.json(
    { token: secret ? issueFormToken(secret) : null },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
};
