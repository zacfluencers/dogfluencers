/**
 * Applies every file in supabase/migrations, in order. Each migration is
 * written to be safe to run again, so re-running brings a database up to date.
 *
 *   npx tsx --env-file=.env scripts/db-migrate.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('Set SUPABASE_DB_URL in .env (Supabase > Project Settings > Database > Connection string).');
  process.exit(1);
}

const dir = join(import.meta.dirname, '..', 'supabase', 'migrations');
const sql = postgres(url, { ssl: 'require', max: 1, onnotice: () => {} });

try {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await sql.unsafe(readFileSync(join(dir, file), 'utf8'));
    console.log(`Applied ${file}`);
  }
} finally {
  await sql.end();
}
