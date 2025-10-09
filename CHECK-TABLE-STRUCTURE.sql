-- CHECK TABLE STRUCTURE AND RELATIONSHIPS
-- Run this in Supabase SQL Editor

-- 1. Check if both tables exist and their columns
SELECT 'group_members columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

SELECT 'friend_groups columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'friend_groups'
ORDER BY ordinal_position;

-- 2. Check foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'group_members' OR tc.table_name = 'friend_groups');

-- 3. Test the exact query your code is trying to run
-- (This might fail and show us the exact error)
SELECT
    group_id,
    role,
    joined_at,
    friend_groups (
        id,
        name,
        description,
        invite_code,
        created_by,
        created_at
    )
FROM group_members
LIMIT 1;