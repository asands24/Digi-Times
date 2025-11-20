-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for displaying other users in groups)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- FRIEND_GROUPS TABLE POLICIES
-- =============================================

ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;

-- Users can view groups they are members of
DROP POLICY IF EXISTS "Users can view groups they are members of" ON friend_groups;
CREATE POLICY "Users can view groups they are members of"
  ON friend_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = friend_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create groups
DROP POLICY IF EXISTS "Authenticated users can create groups" ON friend_groups;
CREATE POLICY "Authenticated users can create groups"
  ON friend_groups FOR INSERT
  WITH CHECK (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

-- Group owners can update their groups
DROP POLICY IF EXISTS "Group owners can update their groups" ON friend_groups;
CREATE POLICY "Group owners can update their groups"
  ON friend_groups FOR UPDATE
  USING (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

-- Group owners can delete their groups
DROP POLICY IF EXISTS "Group owners can delete their groups" ON friend_groups;
CREATE POLICY "Group owners can delete their groups"
  ON friend_groups FOR DELETE
  USING (
    auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  );

-- =============================================
-- GROUP_MEMBERS TABLE POLICIES
-- =============================================

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership rows; owners can view all members
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Group owners can view group members" ON group_members;
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

-- Users can join groups (insert themselves)
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
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

-- Users can leave groups or owners can remove members
DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or owners can remove members" ON group_members;
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
-- NEWSLETTERS TABLE POLICIES
-- =============================================

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Users can view newsletters for groups they belong to
DROP POLICY IF EXISTS "Users can view newsletters in their groups" ON newsletters;
CREATE POLICY "Users can view newsletters in their groups"
  ON newsletters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create newsletters for their groups
DROP POLICY IF EXISTS "Users can create newsletters in their groups" ON newsletters;
CREATE POLICY "Users can create newsletters in their groups"
  ON newsletters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Newsletter creators and group admins can update
DROP POLICY IF EXISTS "Creators and admins can update newsletters" ON newsletters;
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

-- Newsletter creators and group admins can delete
DROP POLICY IF EXISTS "Creators and admins can delete newsletters" ON newsletters;
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

-- Users can view collaborators of newsletters they can access
DROP POLICY IF EXISTS "Users can view collaborators of accessible newsletters" ON newsletter_collaborators;
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

-- Newsletter owners can add collaborators
DROP POLICY IF EXISTS "Newsletter owners can add collaborators" ON newsletter_collaborators;
CREATE POLICY "Newsletter owners can add collaborators"
  ON newsletter_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND newsletters.created_by = auth.uid()
    )
  );

-- Newsletter owners can remove collaborators
DROP POLICY IF EXISTS "Newsletter owners can remove collaborators" ON newsletter_collaborators;
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

-- Users can view events for newsletters they can access
DROP POLICY IF EXISTS "Users can view events in accessible newsletters" ON events;
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

-- Users can create events in newsletters they can access
DROP POLICY IF EXISTS "Users can create events in accessible newsletters" ON events;
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

-- Event creators and group admins can update
DROP POLICY IF EXISTS "Event creators and admins can update events" ON events;
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

-- Event creators and group admins can delete
DROP POLICY IF EXISTS "Event creators and admins can delete events" ON events;
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

-- Users can view attendees of events they can access
DROP POLICY IF EXISTS "Users can view attendees of accessible events" ON event_attendees;
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

-- Users can add themselves as attendees
DROP POLICY IF EXISTS "Users can add themselves as attendees" ON event_attendees;
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

-- Users can remove themselves or be removed by event creators
DROP POLICY IF EXISTS "Users can remove themselves from events" ON event_attendees;
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

-- Users can view photos in events they can access
DROP POLICY IF EXISTS "Users can view photos in accessible events" ON photos;
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

-- Users can upload photos to events they can access
DROP POLICY IF EXISTS "Users can upload photos to accessible events" ON photos;
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

-- Photo uploaders can update their own photos
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Photo uploaders and event creators can delete photos
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;
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

-- =============================================
-- STORY_ARCHIVES TABLE POLICIES
-- =============================================

ALTER TABLE story_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their stories" ON story_archives;
CREATE POLICY "Users can view their stories"
  ON story_archives FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their stories" ON story_archives;
CREATE POLICY "Users can insert their stories"
  ON story_archives FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their stories" ON story_archives;
CREATE POLICY "Users can update their stories"
  ON story_archives FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their stories" ON story_archives;
CREATE POLICY "Users can delete their stories"
  ON story_archives FOR DELETE
  USING (auth.uid() = created_by);
