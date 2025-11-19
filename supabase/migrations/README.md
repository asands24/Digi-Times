# Supabase Migrations

This directory contains SQL migration files for the DigiTimes database.

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed and linked to your project:

```bash
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file you want to apply
4. Paste into the SQL Editor
5. Click "Run" to execute

## Migration Files

### `20250118_rls_story_archives.sql`

**Purpose:** Implements Row Level Security (RLS) policies for the `story_archives` table.

**What it does:**
- Enables RLS on the `story_archives` table
- Allows anonymous users to read stories where `is_public = true`
- Allows authenticated users to read all their own stories (public or private)
- Allows authenticated users to create, update, and delete their own stories

**How to test:**
1. Apply the migration
2. Try accessing `/read/:id` for a public story while logged out - should work
3. Try accessing `/read/:id` for a private story while logged out - should fail
4. Log in as the story owner and access a private story - should work

### `20250322_migrate_story_archives_owner.sql`

**Purpose:** Backfills the `created_by` column on `story_archives`, drops the legacy `user_id` column, and recreates the supporting index. This keeps the database in sync with the updated application code and prevents timeouts caused by full table scans.

**What it does:**
- Adds `created_by` if it does not exist.
- Copies any existing `user_id` values into `created_by`.
- Recreates the owner index on `created_by` and removes the old `user_id` column.

**How to test:**
1. Run the migration.
2. Verify `created_by` is populated by running `select created_by from story_archives limit 5;`.
3. Confirm the new index appears via `select indexname from pg_indexes where tablename = 'story_archives';`.

## Important Notes

- **Do not modify existing migration files** - create new ones instead
- Always test migrations on a development/staging environment first
- Make sure to backup your database before applying migrations to production
