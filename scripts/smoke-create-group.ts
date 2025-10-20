import { randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const findProjectRoot = (startDir: string) => {
  let current = startDir;

  while (true) {
    if (existsSync(resolve(current, 'package.json'))) {
      return current;
    }

    const parent = resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }

  return startDir;
};

const projectRoot = findProjectRoot(__dirname);
const envFiles = ['.env.local', '.env'];

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const [key, ...valueParts] = line.split('=');
    if (!key || !valueParts.length) continue;
    if (process.env[key] !== undefined) continue;

    let value = valueParts.join('=').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
};

for (const file of envFiles) {
  const envPath = resolve(projectRoot, file);
  loadEnvFile(envPath);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.REACT_APP_SUPABASE_URL;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(url, anon);

const isMissingColumnError = (
  error: { code?: string | null; message?: string | null } | null,
  column: string
) => {
  if (!error) return false;

  if (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    error.code === 'PGRST206' ||
    error.code === 'PGRST301' ||
    error.code === 'PGRST302'
  ) {
    return true;
  }

  if (!error.message) return false;
  const message = error.message.toLowerCase();
  const normalizedColumn = column.toLowerCase();

  return (
    message.includes(`'${normalizedColumn}' column`) ||
    message.includes(`"${normalizedColumn}" column`) ||
    message.includes(`column '${normalizedColumn}'`) ||
    message.includes(`column "${normalizedColumn}"`) ||
    message.includes(`could not find the '${normalizedColumn}' column`) ||
    message.includes(`${normalizedColumn} column does not exist`)
  );
};

const getOrCreateSession = async () => {
  const { data: currentSession, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Failed to get current session: ${error.message}`);
  }

  if (currentSession.session?.user) {
    return currentSession.session;
  }

  const email =
    process.env.SMOKE_TEST_EMAIL ??
    process.env.SUPABASE_SMOKE_EMAIL ??
    process.env.SUPABASE_TEST_EMAIL;
  const password =
    process.env.SMOKE_TEST_PASSWORD ??
    process.env.SUPABASE_SMOKE_PASSWORD ??
    process.env.SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'No auth session in dev. Provide SMOKE_TEST_EMAIL/SMOKE_TEST_PASSWORD (or Supabase equivalents) so the smoke script can sign in automatically.'
    );
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in for smoke test: ${signInError?.message ?? 'Unknown error'}`);
  }

  return signInData.session;
};

const generateInviteCode = () => randomBytes(4).toString('hex').toUpperCase();

(async () => {
  const name = 'SmokeTest-' + Date.now();
  const session = await getOrCreateSession();
  const { user } = session;

  const baseGroupPayload = {
    name,
    description: 'smoke',
    invite_code: generateInviteCode(),
  };

  const ownerColumns: Array<'owner_id' | 'created_by'> = ['owner_id', 'created_by'];
  let group: Record<string, unknown> | null = null;
  let usedOwnerColumn: 'owner_id' | 'created_by' | null = null;
  let lastError: Error | null = null;

  for (const column of ownerColumns) {
    const payload = { ...baseGroupPayload, [column]: user.id };
    const { data, error } = await supabase.from('friend_groups').insert(payload).select();
    if (!error && data?.[0]) {
      group = data[0];
      usedOwnerColumn = column;
      break;
    }

    if (isMissingColumnError(error, column)) {
      lastError = error;
      continue;
    }

    if (error) {
      throw new Error(`Failed to create smoke group: ${error.message}`);
    }
  }

  if (!group || !usedOwnerColumn) {
    throw new Error(
      `Failed to create smoke group: ${
        lastError?.message ?? 'database did not return a group record'
      }`
    );
  }

  const groupId = typeof (group as { id?: unknown }).id === 'string' ? (group as { id: string }).id : null;

  if (!groupId) {
    throw new Error('Smoke group insert succeeded but no group was returned');
  }

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    role: 'admin',
  });

  if (memberError) {
    throw new Error(
      `Created group ${groupId} but failed to add creator as admin: ${memberError.message}`
    );
  }

  console.log(`Created group using ${usedOwnerColumn} column:`, { ...group, id: groupId });
})().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
