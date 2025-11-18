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

## Important Notes

- **Do not modify existing migration files** - create new ones instead
- Always test migrations on a development/staging environment first
- Make sure to backup your database before applying migrations to production
