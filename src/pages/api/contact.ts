/**
 * Enquiry endpoint. The one on-demand route on an otherwise static site.
 *
 * JavaScript submits ask for JSON. A plain form post (no JavaScript) is sent on
 * to the thank-you page, or back to the form if something went wrong.
 */
import type { APIRoute } from 'astro';
import { agency } from '../../agency/config';
import { handleEnquiry } from '../../system/lib/enquiry';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return wantsJson ? Response.json({ error: 'Invalid submission.' }, { status: 400 }) : redirect('/contact/?error=1#enquiry', 303);
  }

  const result = await handleEnquiry(form, agency, import.meta.env.RESEND_API_KEY);

  if (wantsJson) {
    return result.ok ? Response.json({ ok: true }) : Response.json({ error: result.error }, { status: result.status });
  }
  return redirect(result.ok ? '/contact/thanks/' : '/contact/?error=1#enquiry', 303);
};
