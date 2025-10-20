-- =============================================
-- Row Level Security (RLS) Policies - FIXED
-- This version fixes infinite recursion issues
-- =============================================

-- First, drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view groups they are members of" ON friend_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON friend_groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON friend_groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON friend_groups;

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON group_members;

DROP POLICY IF EXISTS "Users can view newsletters in their groups" ON newsletters;
DROP POLICY IF EXISTS "Users can create newsletters in their groups" ON newsletters;
DROP POLICY IF EXISTS "Creators and admins can update newsletters" ON newsletters;
DROP POLICY IF EXISTS "Creators and admins can delete newsletters" ON newsletters;

DROP POLICY IF EXISTS "Users can view collaborators of accessible newsletters" ON newsletter_collaborators;
DROP POLICY IF EXISTS "Newsletter owners can add collaborators" ON newsletter_collaborators;
DROP POLICY IF EXISTS "Newsletter owners can remove collaborators" ON newsletter_collaborators;

DROP POLICY IF EXISTS "Users can view events in accessible newsletters" ON events;
DROP POLICY IF EXISTS "Users can create events in accessible newsletters" ON events;
DROP POLICY IF EXISTS "Event creators and admins can update events" ON events;
DROP POLICY IF EXISTS "Event creators and admins can delete events" ON events;

DROP POLICY IF EXISTS "Users can view attendees of accessible events" ON event_attendees;
DROP POLICY IF EXISTS "Users can add themselves as attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can remove themselves from events" ON event_attendees;

DROP POLICY IF EXISTS "Users can view photos in accessible events" ON photos;
DROP POLICY IF EXISTS "Users can upload photos to accessible events" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- GROUP_MEMBERS TABLE POLICIES (Define First)
-- =============================================

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Group owners can view group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND auth.uid() = COALESCE(
        (row_to_json(friend_groups)->>'owner_id')::uuid,
        (row_to_json(friend_groups)->>'created_by')::uuid
      )
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND auth.uid() = COALESCE(
        (row_to_json(friend_groups)->>'owner_id')::uuid,
        (row_to_json(friend_groups)->>'created_by')::uuid
      )
    )
  );

CREATE POLICY "Users can leave groups or owners can remove members"
  ON group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM friend_groups
      WHERE friend_groups.id = group_members.group_id
      AND auth.uid() = COALESCE(
        (row_to_json(friend_groups)->>'owner_id')::uuid,
        (row_to_json(friend_groups)->>'created_by')::uuid
      )
    )
  );

-- =============================================
-- FRIEND_GROUPS TABLE POLICIES
-- =============================================

ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of"
  ON friend_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = friend_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON friend_groups FOR INSERT
  WITH CHECK (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

CREATE POLICY "Group owners can update their groups"
  ON friend_groups FOR UPDATE
  USING (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

CREATE POLICY "Group owners can delete their groups"
  ON friend_groups FOR DELETE
  USING (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

-- =============================================
-- NEWSLETTERS TABLE POLICIES
-- =============================================

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view newsletters in their groups"
  ON newsletters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create newsletters in their groups"
  ON newsletters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators and admins can update newsletters"
  ON newsletters FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Creators and admins can delete newsletters"
  ON newsletters FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- =============================================
-- NEWSLETTER_COLLABORATORS TABLE POLICIES
-- =============================================

ALTER TABLE newsletter_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators of accessible newsletters"
  ON newsletter_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM newsletters n
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE n.id = newsletter_collaborators.newsletter_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Newsletter owners can add collaborators"
  ON newsletter_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND newsletters.created_by = auth.uid()
    )
  );

CREATE POLICY "Newsletter owners can remove collaborators"
  ON newsletter_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND newsletters.created_by = auth.uid()
    )
  );

-- =============================================
-- EVENTS TABLE POLICIES
-- =============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in accessible newsletters"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM newsletters n
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE n.id = events.newsletter_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in accessible newsletters"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM newsletters n
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE n.id = events.newsletter_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators and admins can update events"
  ON events FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM newsletters n
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE n.id = events.newsletter_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Event creators and admins can delete events"
  ON events FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM newsletters n
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE n.id = events.newsletter_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- =============================================
-- EVENT_ATTENDEES TABLE POLICIES
-- =============================================

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendees of accessible events"
  ON event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN newsletters n ON n.id = e.newsletter_id
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE e.id = event_attendees.event_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves as attendees"
  ON event_attendees FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM events e
      JOIN newsletters n ON n.id = e.newsletter_id
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE e.id = event_attendees.event_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove themselves from events"
  ON event_attendees FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendees.event_id
      AND events.created_by = auth.uid()
    )
  );

-- =============================================
-- PHOTOS TABLE POLICIES
-- =============================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos in accessible events"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN newsletters n ON n.id = e.newsletter_id
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE e.id = photos.event_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos to accessible events"
  ON photos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM events e
      JOIN newsletters n ON n.id = e.newsletter_id
      JOIN group_members gm ON gm.group_id = n.group_id
      WHERE e.id = photos.event_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photos.event_id
      AND events.created_by = auth.uid()
    )
  );
