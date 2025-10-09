-- Run this in Supabase SQL Editor to check your current table structure
-- This will help us understand what tables actually exist

-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check current policies on group_members
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'group_members';

-- Check if you have 'groups' or 'friend_groups' table
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('groups', 'friend_groups');

-- Check the structure of group_members table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'group_members'
ORDER BY ordinal_position;