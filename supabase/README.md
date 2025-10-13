# Supabase Database Setup Guide

This guide will walk you through setting up your Supabase database for the DigiTimes application.

## Prerequisites

- A Supabase account at https://supabase.com
- Your Supabase project created (you already have: `irxpqhxrylaxfdppnwra`)

## Setup Steps

### 1. Run Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/irxpqhxrylaxfdppnwra
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `schema.sql` and paste it into the editor
5. Click **Run** to execute the SQL

This will create all the necessary tables:
- `profiles` - User profile information
- `friend_groups` - Photo sharing groups
- `group_members` - Group membership tracking
- `newsletters` - Photo newsletters
- `newsletter_collaborators` - Newsletter permissions
- `events` - Photo events within newsletters
- `event_attendees` - Event participation
- `photos` - Photo metadata and references

### 2. Apply Row Level Security Policies

**IMPORTANT:** Use the fixed version to avoid infinite recursion errors!

1. In the **SQL Editor**, create another new query
2. Copy the contents of `rls-policies-fixed.sql` and paste it
3. Click **Run** to execute

> **Note:** If you already ran `rls-policies.sql` and got "infinite recursion" errors, run `rls-policies-fixed.sql` which drops and recreates all policies correctly.

This sets up security policies ensuring:
- Users can only see groups they're members of
- Users can only access newsletters/events in their groups
- Users can only upload/manage their own photos
- Proper admin permissions for group owners

### 3. Set Up Storage Bucket

1. In the **SQL Editor**, create another new query
2. Copy the contents of `storage-policies.sql` and paste it
3. Click **Run** to execute

This creates:
- A public `photos` bucket for storing uploaded images
- Storage policies for upload, view, update, and delete permissions

### 4. Verify Setup

#### Check Tables
1. Go to **Table Editor** in the sidebar
2. Verify all tables are listed and visible

#### Check Storage
1. Go to **Storage** in the sidebar
2. Verify the `photos` bucket exists
3. Click on the bucket and verify policies are applied

#### Check Authentication
1. Go to **Authentication** in the sidebar
2. Click **Policies** tab
3. Verify that the **Providers** section shows email is enabled

### 5. Configure Email Provider (Optional but Recommended)

For production, you'll want to configure a proper email provider for magic links:

1. Go to **Authentication** > **Providers**
2. Click **Email** provider
3. Configure SMTP settings or use a service like:
   - SendGrid
   - Postmark
   - AWS SES
   - Resend

For development/testing, the default Supabase email works fine.

### 6. Test the Database

You can test the setup by creating a test user:

```sql
-- Insert a test user (run in SQL Editor)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### 7. Disable Mock Auth in Production

Once your database is set up and working:

```bash
# In your terminal
netlify env:set REACT_APP_USE_MOCK_AUTH "false"
netlify deploy --prod
```

## Database Schema Overview

```
profiles (user info)
    └── friend_groups (groups)
            └── group_members (memberships)
            └── newsletters (photo collections)
                    └── newsletter_collaborators
                    └── events (photo events)
                            └── event_attendees
                            └── photos (uploaded photos)
```

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Data isolation between groups
- Proper access control
- Users can only modify their own data
- Group admins have elevated permissions

### Storage Security
- Photos are stored in a dedicated bucket
- Upload permissions tied to group membership
- Users can only delete their own photos
- Event creators can moderate photos in their events

## Troubleshooting

### "infinite recursion detected in policy" errors
**This is the most common error!**
- You need to use `rls-policies-fixed.sql` instead of `rls-policies.sql`
- The fixed version prevents policies from referencing themselves
- Run the fixed SQL file to drop and recreate all policies correctly

To fix:
```sql
-- In Supabase SQL Editor, run the contents of:
-- rls-policies-fixed.sql
```

### "relation does not exist" errors
- Make sure you ran the schema.sql file completely
- Check the SQL Editor for any errors during execution

### "new row violates row-level security policy" errors
- Verify RLS policies were applied correctly
- Check that the user is authenticated
- Ensure the user has proper group membership

### Authentication issues
- Verify email provider is configured
- Check that the trigger for auto-creating profiles is working
- Look at the auth.users table to confirm users are being created

## Next Steps

After setup:
1. Test user registration
2. Create a test group
3. Upload a test photo
4. Verify all permissions work correctly
5. Deploy to production with mock auth disabled

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify all SQL scripts ran without errors
3. Test queries directly in the SQL Editor
4. Check browser console for detailed error messages
