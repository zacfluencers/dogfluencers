/**
 * Keeps a Mailchimp audience in step with the CRM.
 *
 * Push: every creator who is new or changed since their last sync is added to
 * the audience (subscribed, if Mailchimp has never seen them) with their
 * name, location, reach and rate as merge fields, and their status, origin
 * and agency answers as tags. Mailchimp's own subscription status is never
 * overwritten, so an unsubscribe in Mailchimp always stands.
 *
 * Pull: subscription changes in Mailchimp (unsubscribed, bounced and
 * cleaned, resubscribed) are written back to the creator's record.
 *
 * Run from the hourly cron route. Takes its settings as arguments, so it
 * never reads an agency file or the environment itself.
 */
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Creator, CrmConfig } from './types';
import { APPLICATION_STATUSES } from './options';
import { answersOf } from './validation';
import { answerMatches, filterFields } from './query';

export interface MailchimpSettings {
  /** The key ends in its data centre, e.g. "…-us21". */
  apiKey: string;
  audienceId: string;
  /** Put on every creator, for an audience shared with other contacts. */
  audienceTag?: string;
}

export type EmailMarketing = 'subscribed' | 'unsubscribed' | 'cleaned';

/** Merge fields this sync fills, beyond Mailchimp's own FNAME and LNAME. */
const MERGE_FIELDS = [
  { tag: 'TOWN', name: 'Town', type: 'text' },
  { tag: 'COUNTRY', name: 'Country', type: 'text' },
  { tag: 'INSTAGRAM', name: 'Instagram followers', type: 'number' },
  { tag: 'TIKTOK', name: 'TikTok followers', type: 'number' },
  { tag: 'YOUTUBE', name: 'YouTube subscribers', type: 'number' },
  { tag: 'RATE', name: 'Rate per post', type: 'number' },
] as const;

const hash = (email: string) => createHash('md5').update(email.trim().toLowerCase()).digest('hex');

function client({ apiKey, audienceId }: MailchimpSettings) {
  const dc = apiKey.split('-').pop();
  const base = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}`;
  const auth = `Basic ${Buffer.from(`sync:${apiKey}`).toString('base64')}`;
  return async (path: string, init: { method?: string; body?: unknown } = {}) => {
    const res = await fetch(base + path, {
      method: init.method ?? 'GET',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data: data as any };
  };
}

/** Every tag the sync manages, so a changed answer can drop its old tag. */
export function managedTags(config: CrmConfig, audienceTag?: string): string[] {
  const tags = [
    ...(audienceTag ? [audienceTag] : []),
    ...APPLICATION_STATUSES.map((s) => `Status: ${s.label}`),
    'Joined: Old website',
    'Joined: Join form',
    'Login: Set up',
    'Login: Not yet',
    'Gifting network',
  ];
  for (const { field, options } of filterFields(config)) {
    const label = field.filterLabel ?? field.teamLabel ?? field.label.replace(/\?$/, '');
    for (const o of options) tags.push(`${label}: ${o.label}`);
  }
  return tags;
}

export function tagsFor(c: Creator, config: CrmConfig, audienceTag?: string): string[] {
  const status = APPLICATION_STATUSES.find((s) => s.value === c.application_status);
  const tags = [
    ...(audienceTag ? [audienceTag] : []),
    ...(status ? [`Status: ${status.label}`] : []),
    c.source === 'import' ? 'Joined: Old website' : 'Joined: Join form',
    c.auth_user_id ? 'Login: Set up' : 'Login: Not yet',
    ...(c.join_gifting_network ? ['Gifting network'] : []),
  ];
  // A repeated step tags every item's answer: two pets, two size tags.
  const today = new Date();
  for (const filter of filterFields(config)) {
    const label = filter.field.filterLabel ?? filter.field.teamLabel ?? filter.field.label.replace(/\?$/, '');
    const answers = answersOf(c.details, filter.field, filter.repeat);
    for (const o of filter.options) {
      if (answers.some((a) => answerMatches(filter, a, o.value, today))) tags.push(`${label}: ${o.label}`);
    }
  }
  return tags;
}

export function mergeFieldsFor(c: Creator): Record<string, string | number> {
  const n = (v: number | string | null) => (v === null ? '' : Number(v));
  return {
    FNAME: c.first_name ?? '',
    LNAME: c.last_name ?? '',
    TOWN: c.town ?? '',
    COUNTRY: c.country ?? '',
    INSTAGRAM: n(c.instagram_followers),
    TIKTOK: n(c.tiktok_followers),
    YOUTUBE: n(c.youtube_followers),
    RATE: n(c.rate_per_post),
  };
}

/** Creates any of the sync's merge fields the audience doesn't have yet. */
async function ensureMergeFields(api: ReturnType<typeof client>) {
  const { ok, status, data } = await api('/merge-fields?count=100&fields=merge_fields.tag');
  if (!ok) throw new Error(`Mailchimp audience not reachable (${status}): ${data?.detail ?? ''}`);
  const have = new Set<string>((data.merge_fields ?? []).map((f: { tag: string }) => f.tag));
  for (const f of MERGE_FIELDS) {
    if (have.has(f.tag)) continue;
    const res = await api('/merge-fields', { method: 'POST', body: { tag: f.tag, name: f.name, type: f.type, public: false } });
    if (!res.ok) throw new Error(`Couldn't add the ${f.tag} field to Mailchimp: ${res.data?.detail ?? res.status}`);
  }
}

/**
 * Makes each managed tag exist exactly once before members are tagged in
 * parallel: two requests naming a new tag at the same moment would each
 * create it. Returns true if duplicates were removed, as their members then
 * need tagging again.
 */
async function ensureTags(api: ReturnType<typeof client>, all: string[]) {
  const { ok, status, data } = await api('/segments?type=static&count=1000&fields=segments.id,segments.name,segments.member_count');
  if (!ok) throw new Error(`Mailchimp tags not readable (${status}): ${data?.detail ?? ''}`);
  const byName = new Map<string, { id: number; member_count: number }[]>();
  for (const seg of (data.segments ?? []) as { id: number; name: string; member_count: number }[]) {
    byName.set(seg.name, [...(byName.get(seg.name) ?? []), seg]);
  }
  let removed = false;
  for (const name of all) {
    const found = (byName.get(name) ?? []).sort((a, b) => b.member_count - a.member_count);
    if (!found.length) {
      const res = await api('/segments', { method: 'POST', body: { name, static_segment: [] } });
      if (!res.ok) throw new Error(`Couldn't add the "${name}" tag to Mailchimp: ${res.data?.detail ?? res.status}`);
    }
    for (const extra of found.slice(1)) {
      const res = await api(`/segments/${extra.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Couldn't remove a duplicate "${name}" tag: ${res.data?.detail ?? res.status}`);
      removed = true;
    }
  }
  return removed;
}

type PushOutcome = { done: true; status?: EmailMarketing } | { done: false; error: string };

async function pushOne(api: ReturnType<typeof client>, c: Creator, all: string[], config: CrmConfig, audienceTag?: string): Promise<PushOutcome> {
  const id = hash(c.email);
  const put = await api(`/members/${id}`, {
    method: 'PUT',
    // status_if_new only applies to someone Mailchimp has never seen: an
    // existing member keeps whatever status they chose.
    body: { email_address: c.email, status_if_new: 'subscribed', merge_fields: mergeFieldsFor(c) },
  });
  if (!put.ok) {
    const title = String(put.data?.title ?? '');
    // Unsubscribed and then deleted in Mailchimp: it won't take them back.
    if (title === 'Member In Compliance State') return { done: true, status: 'unsubscribed' };
    // A permanent refusal (an address Mailchimp considers fake, say): don't retry every hour.
    if (put.status === 400) return { done: true };
    return { done: false, error: `${put.status} ${title}` };
  }
  const active = new Set(tagsFor(c, config, audienceTag));
  const tags = await api(`/members/${id}/tags`, {
    method: 'POST',
    body: { tags: all.map((name) => ({ name, status: active.has(name) ? 'active' : 'inactive' })) },
  });
  if (!tags.ok) return { done: false, error: `tags ${tags.status} ${tags.data?.title ?? ''}` };
  const status = put.data?.status;
  return { done: true, status: status === 'subscribed' || status === 'unsubscribed' || status === 'cleaned' ? status : undefined };
}

/** Sends new and changed creators to Mailchimp. */
export async function pushToMailchimp(db: SupabaseClient, settings: MailchimpSettings, config: CrmConfig, limit = 500) {
  const api = client(settings);
  await ensureMergeFields(api);
  const all = managedTags(config, settings.audienceTag);
  if (await ensureTags(api, all)) {
    // Members of a removed duplicate lost that tag: send everyone again.
    // Bookkeeping only, so updated_at stays put.
    const { error: resetError } = await db.from('creators').update({ mailchimp_synced_at: null }).not('mailchimp_synced_at', 'is', null);
    if (resetError) throw resetError;
  }
  const { data, error } = await db.rpc('mailchimp_pending', { p_limit: limit });
  if (error) throw error;
  const rows = (data ?? []) as Creator[];
  const synced: { id: string; updated_at: string }[] = [];
  const errors: string[] = [];

  // Mailchimp allows ten connections at once; stay well under.
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        const outcome = await pushOne(api, c, all, config, settings.audienceTag);
        if (!outcome.done) {
          errors.push(outcome.error);
          continue;
        }
        if (outcome.status) {
          const { error: statusError } = await db.rpc('mailchimp_set_status', { p_email: c.email, p_status: outcome.status, p_at: new Date().toISOString() });
          if (statusError) errors.push(`status ${statusError.message}`);
        }
        synced.push({ id: c.id, updated_at: c.updated_at });
      }
    }),
  );

  if (synced.length) {
    const { error: markError } = await db.rpc('mailchimp_mark_synced', { p_rows: synced });
    if (markError) throw markError;
  }
  return { pending: rows.length, synced: synced.length, failed: errors.length, errors: errors.slice(0, 5) };
}

/** Writes subscription changes made in Mailchimp since `since` back to the CRM. */
export async function pullFromMailchimp(db: SupabaseClient, settings: MailchimpSettings, since: Date) {
  const api = client(settings);
  let updated = 0;
  for (let offset = 0; ; offset += 1000) {
    const { ok, status, data } = await api(
      `/members?count=1000&offset=${offset}&since_last_changed=${encodeURIComponent(since.toISOString())}&fields=members.email_address,members.status,members.last_changed,total_items`,
    );
    if (!ok) throw new Error(`Mailchimp members not readable (${status}): ${data?.detail ?? ''}`);
    const members = (data.members ?? []) as { email_address: string; status: string; last_changed: string }[];
    for (const m of members) {
      if (m.status !== 'subscribed' && m.status !== 'unsubscribed' && m.status !== 'cleaned') continue;
      const { error } = await db.rpc('mailchimp_set_status', { p_email: m.email_address, p_status: m.status, p_at: m.last_changed });
      if (error) throw error;
      updated += 1;
    }
    if (members.length < 1000) break;
  }
  return { checked: updated };
}

/**
 * The audience's name and size, so a dry run shows where creators would go,
 * and any of the sync's tags it already uses (in a shared audience, someone
 * else's tag of the same name would be switched off for these creators).
 */
export async function audienceSummary(settings: MailchimpSettings, config: CrmConfig) {
  const api = client(settings);
  const { ok, status, data } = await api('?fields=name,stats.member_count,stats.unsubscribe_count');
  if (!ok) throw new Error(`Mailchimp audience not reachable (${status}): ${data?.detail ?? ''}`);
  const tags = await api('/segments?type=static&count=1000&fields=segments.name,segments.member_count');
  const existing = (tags.data?.segments ?? []) as { name: string; member_count: number }[];
  const ours = new Set(managedTags(config, settings.audienceTag));
  return {
    name: data.name as string,
    members: data.stats?.member_count as number,
    unsubscribed: data.stats?.unsubscribe_count as number,
    existingTags: existing.length,
    clashingTags: existing.filter((t) => ours.has(t.name)).map((t) => `${t.name} (${t.member_count})`),
  };
}
