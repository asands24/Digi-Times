-- Enable Row Level Security for all tables
-- Run this in your Supabase SQL Editor

-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view group members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they belong to" ON friend_groups;

-- Create the corrected policies

-- Friend Groups policies (matches your useGroups.js code)
CREATE POLICY "Users can view groups they belong to" ON friend_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = friend_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update their groups" ON friend_groups
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups" ON friend_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON friend_groups
  FOR DELETE USING (created_by = auth.uid());

-- Group Members policies (fixed to avoid infinite recursion)
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as group members" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove themselves from groups" ON group_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can manage group members" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members admin_check
      WHERE admin_check.group_id = group_members.group_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('admin', 'owner')
    )
  );

-- Additional policies for other tables that reference groups

-- Newsletters policies
CREATE POLICY "Users can view newsletters from their groups" ON newsletters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create newsletters" ON newsletters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = newsletters.group_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = created_by
  );

CREATE POLICY "Newsletter creators can update their newsletters" ON newsletters
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Newsletter creators can delete their newsletters" ON newsletters
  FOR DELETE USING (created_by = auth.uid());

-- Events policies
CREATE POLICY "Users can view events from their groups" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.newsletter_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.newsletter_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = created_by
  );

CREATE POLICY "Event creators can update their events" ON events
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete their events" ON events
  FOR DELETE USING (created_by = auth.uid());

-- Photos policies
CREATE POLICY "Users can view photos from events in their groups" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN group_members ON group_members.group_id = events.newsletter_id
      WHERE events.id = photos.event_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can upload photos to events" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN group_members ON group_members.group_id = events.newsletter_id
      WHERE events.id = photos.event_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = uploaded_by
  );

CREATE POLICY "Photo uploaders can update their photos" ON photos
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Photo uploaders can delete their photos" ON photos
  FOR DELETE USING (uploaded_by = auth.uid());

-- Newsletter collaborators policies
CREATE POLICY "Users can view newsletter collaborators for their groups" ON newsletter_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM newsletters
      JOIN group_members ON group_members.group_id = newsletters.group_id
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Newsletter creators can add collaborators" ON newsletter_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND newsletters.created_by = auth.uid()
    )
  );

CREATE POLICY "Newsletter creators can remove collaborators" ON newsletter_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = newsletter_collaborators.newsletter_id
      AND newsletters.created_by = auth.uid()
    )
  );

-- Event attendees policies
CREATE POLICY "Users can view event attendees for their groups" ON event_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN group_members ON group_members.group_id = events.newsletter_id
      WHERE events.id = event_attendees.event_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can join/leave events" ON event_attendees
  FOR ALL USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events
      JOIN group_members ON group_members.group_id = events.newsletter_id
      WHERE events.id = event_attendees.event_id
      AND group_members.user_id = auth.uid()
    )
  );