/**
 * CSV of the creators matching the table's current filters, every field.
 */
import type { APIRoute } from 'astro';
import { crm } from '../../../agency/crm';
import { isAdmin } from '../../../system/crm/supabase';
import { listAllCreators } from '../../../system/crm/server';
import { parseCreatorQuery, queryCreators, toRow } from '../../../system/crm/query';
import { creatorsToCsv } from '../../../system/crm/csv';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url, redirect }) => {
  const supabase = locals.session?.supabase;
  if (!supabase || !(await isAdmin(supabase))) return redirect('/admin/login/?error=forbidden', 303);

  const creators = await listAllCreators(supabase);
  const byId = new Map(creators.map((c) => [c.id, c]));
  const matching = queryCreators(creators.map((c) => toRow(c, crm)), parseCreatorQuery(url.searchParams, crm), crm);
  const csv = creatorsToCsv(matching.map((r) => byId.get(r.id)!), crm);

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="creators-${stamp}.csv"`,
    },
  });
};
