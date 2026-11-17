-- Applications whose email was never confirmed (17 November 2026).
--
-- The join form saves an application as soon as it's sent, before the email is
-- confirmed. A bot with made-up addresses could fill the CRM with them. So:
-- 1. creators.email_confirmed_at copies the login's confirmation time;
-- 2. the team's list and the Mailchimp sync leave out signups not yet confirmed
--    (imported creators are never affected);
-- 3. purge_unconfirmed_signups() deletes signups still unconfirmed after a
--    week, with their logins. The morning email's cron runs it daily.
-- Safe to run again.

alter table public.creators add column if not exists email_confirmed_at timestamptz;

-- Copy each login's confirmation onto its creator, whenever it happens.
create or replace function public.creators_sync_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.creators set email_confirmed_at = new.email_confirmed_at
     where auth_user_id = new.id and email_confirmed_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists creators_sync_email_confirmed on auth.users;
create trigger creators_sync_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.creators_sync_email_confirmed();

-- A login confirmed before its creator row existed (or before this migration).
update public.creators c
   set email_confirmed_at = u.email_confirmed_at
  from auth.users u
 where u.id = c.auth_user_id
   and u.email_confirmed_at is not null
   and c.email_confirmed_at is null;

-- The confirmation time is bookkeeping: it doesn't count as the creator
-- changing their details. (Keeps the list from the Mailchimp migration.)
create or replace function public.creators_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bookkeeping constant text[] := array['updated_at', 'email_marketing', 'email_marketing_at', 'mailchimp_synced_at', 'email_confirmed_at'];
begin
  if (to_jsonb(new) - bookkeeping) = (to_jsonb(old) - bookkeeping) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- The team's list: everyone except signups still waiting on their email.
create or replace function public.admin_list_creators(p_offset integer default 0, p_limit integer default 1000)
returns setof public.creators
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select * from public.creators
     where source <> 'signup' or email_confirmed_at is not null
     order by created_at desc, id
    offset greatest(p_offset, 0)
     limit least(greatest(p_limit, 1), 1000);
end;
$$;

-- Mailchimp: never send a signup that hasn't confirmed its email. Once they
-- confirm, the bookkeeping rule above leaves updated_at alone, so they're
-- still picked up (mailchimp_synced_at is null).
create or replace function public.mailchimp_pending(p_limit integer default 500)
returns setof public.creators
language sql
stable
set search_path = ''
as $$
  select * from public.creators
   where (mailchimp_synced_at is null or updated_at > mailchimp_synced_at)
     and (source <> 'signup' or email_confirmed_at is not null)
   order by mailchimp_synced_at nulls first, updated_at
   limit least(greatest(p_limit, 1), 1000);
$$;
revoke all on function public.mailchimp_pending(integer) from public, anon, authenticated;
grant execute on function public.mailchimp_pending(integer) to service_role;

-- Deletes signups never confirmed after p_days, and their logins. Returns how
-- many went. Server only (the cron, with the service role).
create or replace function public.purge_unconfirmed_signups(p_days integer default 7)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  gone integer;
  logins uuid[];
begin
  select coalesce(array_agg(auth_user_id) filter (where auth_user_id is not null), '{}')
    into logins
    from public.creators
   where source = 'signup'
     and email_confirmed_at is null
     and created_at < now() - make_interval(days => greatest(p_days, 1));

  delete from public.creators
   where source = 'signup'
     and email_confirmed_at is null
     and created_at < now() - make_interval(days => greatest(p_days, 1));
  get diagnostics gone = row_count;

  -- Only logins that never confirmed and belong to no creator any more.
  delete from auth.users
   where id = any(logins)
     and email_confirmed_at is null
     and not exists (select 1 from public.admins a where a.user_id = auth.users.id);

  return gone;
end;
$$;
revoke all on function public.purge_unconfirmed_signups(integer) from public, anon, authenticated;
grant execute on function public.purge_unconfirmed_signups(integer) to service_role;
