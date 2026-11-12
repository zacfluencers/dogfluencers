-- ---------------------------------------------------------------------------
-- Mailchimp sync. The CRM is the source of truth for who a creator is; the
-- Mailchimp audience is the source of truth for whether they want emails.
-- An hourly job (src/system/crm/mailchimp.ts) pushes new and changed
-- creators to the audience and pulls subscription changes back here.
-- ---------------------------------------------------------------------------
alter table public.creators
  add column if not exists email_marketing text
    check (email_marketing is null or email_marketing in ('subscribed', 'unsubscribed', 'cleaned')),
  add column if not exists email_marketing_at timestamptz,
  add column if not exists mailchimp_synced_at timestamptz;

-- Not granted to creators: they read and change neither. The team sees them
-- through admin_get_creator / admin_list_creators (select *).

-- updated_at means "the creator's details changed". Sync bookkeeping alone
-- leaves it as it was, so a sync never counts as an edit (or triggers another).
create or replace function public.creators_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bookkeeping constant text[] := array['updated_at', 'email_marketing', 'email_marketing_at', 'mailchimp_synced_at'];
begin
  if (to_jsonb(new) - bookkeeping) = (to_jsonb(old) - bookkeeping) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists creators_set_updated_at on public.creators;
create trigger creators_set_updated_at
  before update on public.creators
  for each row execute function public.creators_set_updated_at();

-- Creators Mailchimp hasn't seen in their current form.
create or replace function public.mailchimp_pending(p_limit integer default 500)
returns setof public.creators
language sql
stable
set search_path = ''
as $$
  select * from public.creators
   where mailchimp_synced_at is null or updated_at > mailchimp_synced_at
   order by mailchimp_synced_at nulls first, updated_at
   limit least(greatest(p_limit, 1), 1000);
$$;

-- Marks rows synced, but only if they haven't changed since they were read:
-- an edit made mid-sync goes out on the next run.
create or replace function public.mailchimp_mark_synced(p_rows jsonb)
returns void
language sql
set search_path = ''
as $$
  update public.creators c
     set mailchimp_synced_at = now()
    from jsonb_to_recordset(p_rows) as r(id uuid, updated_at timestamptz)
   where c.id = r.id and c.updated_at = r.updated_at;
$$;

-- Records a subscription change reported by Mailchimp.
create or replace function public.mailchimp_set_status(p_email text, p_status text, p_at timestamptz)
returns void
language sql
set search_path = ''
as $$
  update public.creators
     set email_marketing = p_status, email_marketing_at = p_at
   where lower(email::text) = lower(p_email)
     and email_marketing is distinct from p_status;
$$;

revoke all on function public.mailchimp_pending(integer) from public, anon, authenticated;
revoke all on function public.mailchimp_mark_synced(jsonb) from public, anon, authenticated;
revoke all on function public.mailchimp_set_status(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.mailchimp_pending(integer) to service_role;
grant execute on function public.mailchimp_mark_synced(jsonb) to service_role;
grant execute on function public.mailchimp_set_status(text, text, timestamptz) to service_role;
