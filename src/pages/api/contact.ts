/**
 * Enquiry endpoint. The one on-demand route on an otherwise static site.
 *
 * JavaScript submits ask for JSON. A plain form post (no JavaScript) is sent on
 * to the thank-you page, or back to the form if something went wrong.
 */
import type { APIRoute } from 'astro';
import { agency } from '../../agency/config';
import { handleEnquiry } from '../../system/lib/enquiry';
import { crm } from '../../agency/crm';
import { FORM_TOKEN_FIELD, checkFormToken } from '../../system/lib/formguard';

const env = (name: string) => (import.meta.env[name] as string | undefined) || process.env[name];

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return wantsJson ? Response.json({ error: 'Invalid submission.' }, { status: 400 }) : redirect('/contact/?error=1#enquiry', 303);
  }

  // Bot check, after the honeypot: the brief form fetches a signed start time.
  const secret = env('FORM_SECRET') || env('CRON_SECRET');
  const check = secret ? checkFormToken(form.get(FORM_TOKEN_FIELD), secret) : 'ok';
  // Forged or instant: a bot. Answer as if it worked, and send nothing.
  if (check === 'forged' || check === 'too_fast') {
    return wantsJson ? Response.json({ ok: true }) : redirect('/contact/thanks/', 303);
  }
  // Missing (the start time never loaded) or expired (open over a day): ask
  // a person to refresh and send again, rather than dropping a real brief.
  if (check === 'missing' || check === 'expired') {
    const error = 'Please refresh the page and send the form again.';
    return wantsJson ? Response.json({ error }, { status: 400 }) : redirect('/contact/?error=1#enquiry', 303);
  }

  const result = await handleEnquiry(form, agency, import.meta.env.RESEND_API_KEY, crm.emailTheme);

  if (wantsJson) {
    return result.ok ? Response.json({ ok: true }) : Response.json({ error: result.error }, { status: result.status });
  }
  return redirect(result.ok ? '/contact/thanks/' : '/contact/?error=1#enquiry', 303);
};
