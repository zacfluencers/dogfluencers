/**
 * Gives someone access to the team CRM at /admin/. Admin rights can only be
 * granted from here (or the Supabase dashboard), never from the website.
 *
 *   npx tsx --env-file=.env scripts/add-admin.ts name@example.com
 *
 * Creates the login if it doesn't exist, with a temporary password printed
 * once. Ask them to change it from /creator/forgot-password/ straight away.
 */
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const email = process.argv[2]?.trim().toLowerCase();
const { PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, SUPABASE_DB_URL: dbUrl } = process.env;
if (!email || !url || !key || !dbUrl) {
  console.error('Usage: npx tsx --env-file=.env scripts/add-admin.ts <email>  (needs the Supabase settings in .env)');
  process.exit(1);
}

const auth = createClient(url, key, { auth: { persistSession: false } }).auth.admin;
const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

try {
  const [existing] = await sql<{ id: string }[]>`select id from auth.users where lower(email) = ${email}`;
  let id = existing?.id;
  if (!id) {
    const password = randomBytes(12).toString('base64url');
    const { data, error } = await auth.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error('No user returned');
    id = data.user.id;
    console.log(`Created ${email} with temporary password: ${password}`);
  }
  await sql`insert into public.admins (user_id) values (${id}) on conflict do nothing`;
  console.log(`${email} can now log in at /admin/login/`);
} finally {
  await sql.end();
}
