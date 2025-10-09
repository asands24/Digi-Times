-- DEBUG: Check the actual policy definitions to find the recursion
-- Run this in Supabase SQL Editor

-- Show the exact policy definitions for friend_groups
SELECT
    policyname,
    cmd,
    qual as policy_condition,
    with_check
FROM pg_policies
WHERE tablename = 'friend_groups'
ORDER BY policyname;

-- Also check if there are any other policies that might reference friend_groups
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as policy_condition
FROM pg_policies
WHERE qual LIKE '%friend_groups%'
ORDER BY tablename, policyname;