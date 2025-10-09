-- TEMPORARY BYPASS: Disable RLS on friend_groups to get app working
-- This will allow your app to work while we debug the recursion issue

-- Temporarily disable RLS on friend_groups
ALTER TABLE friend_groups DISABLE ROW LEVEL SECURITY;

-- Your app should work now - test it immediately

-- TO RE-ENABLE SECURITY LATER (don't run this yet):
-- ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;