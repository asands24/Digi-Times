# Supabase Setup Guide for Photo Newsletter App

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `photo-newsletter-app`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

## 2. Get Project Credentials

1. Go to Project Settings > API
2. Copy these values for your `.env` file:
   - `Project URL` → `REACT_APP_SUPABASE_URL`
   - `anon public` key → `REACT_APP_SUPABASE_ANON_KEY`

## 3. Database Schema Setup

Run the following SQL commands in the Supabase SQL Editor (Database > SQL Editor):

### Enable Required Extensions

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Create Tables

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend groups table
CREATE TABLE friend_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table (many-to-many relationship)
CREATE TABLE group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Event categories enum
CREATE TYPE event_category AS ENUM (
  'social', 'travel', 'food', 'celebration', 'sports', 'cultural'
);

-- Newsletter layout enum
CREATE TYPE newsletter_layout AS ENUM (
  'grid', 'timeline', 'magazine', 'polaroid', 'minimal', 'scrapbook'
);

-- Newsletters table
CREATE TABLE newsletters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  group_id UUID REFERENCES friend_groups(id) ON DELETE CASCADE NOT NULL,
  layout newsletter_layout DEFAULT 'grid',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  location TEXT,
  category event_category DEFAULT 'social',
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE event_attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Photos table
CREATE TABLE photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter collaborators table
CREATE TABLE newsletter_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'collaborator' CHECK (role IN ('owner', 'editor', 'collaborator')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(newsletter_id, user_id)
);
```

### Create Indexes for Performance

```sql
-- Indexes for better query performance
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_newsletters_group_id ON newsletters(group_id);
CREATE INDEX idx_events_newsletter_id ON events(newsletter_id);
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_newsletter_collaborators_newsletter_id ON newsletter_collaborators(newsletter_id);
CREATE INDEX idx_friend_groups_invite_code ON friend_groups(invite_code);
CREATE INDEX idx_story_archives_created_by ON story_archives(created_by);
CREATE INDEX idx_story_archives_updated_at ON story_archives(updated_at);
CREATE INDEX idx_story_archives_created_by_created_at_desc ON story_archives (created_by, created_at DESC);
```

### Create Functions and Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_friend_groups_updated_at BEFORE UPDATE ON friend_groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ language 'plpgsql';

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

## 4. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view profiles of group members" ON profiles FOR SELECT USING (
  id IN (
    SELECT DISTINCT gm.user_id
    FROM group_members gm
    WHERE gm.group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- Friend groups policies
CREATE POLICY "Users can view groups they belong to" ON friend_groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create groups" ON friend_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON friend_groups FOR UPDATE USING (
  id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Group members policies
CREATE POLICY "Users can view their own memberships" ON group_members FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Group owners can view group members" ON group_members FOR SELECT USING (
  -- Handles both newer owner_id column and legacy created_by column
  EXISTS (
    SELECT 1 FROM friend_groups
    WHERE friend_groups.id = group_members.group_id
    AND auth.uid() = COALESCE(
      (row_to_json(friend_groups)->>'owner_id')::uuid,
      (row_to_json(friend_groups)->>'created_by')::uuid
    )
  )
);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (
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
CREATE POLICY "Users can leave groups or owners can remove members" ON group_members FOR DELETE USING (
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

-- Newsletters policies
CREATE POLICY "Group members can view newsletters" ON newsletters FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group members can create newsletters" ON newsletters FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Newsletter collaborators can update newsletters" ON newsletters FOR UPDATE USING (
  id IN (
    SELECT newsletter_id FROM newsletter_collaborators
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  ) OR created_by = auth.uid()
);

-- Events policies
CREATE POLICY "Users can view events in accessible newsletters" ON events FOR SELECT USING (
  newsletter_id IN (
    SELECT id FROM newsletters
    WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Newsletter collaborators can manage events" ON events FOR ALL USING (
  newsletter_id IN (
    SELECT newsletter_id FROM newsletter_collaborators
    WHERE user_id = auth.uid()
  ) OR created_by = auth.uid()
);

-- Event attendees policies
CREATE POLICY "Users can view event attendees" ON event_attendees FOR SELECT USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN newsletters n ON e.newsletter_id = n.id
    WHERE n.group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Users can manage their own attendance" ON event_attendees FOR ALL USING (user_id = auth.uid());

-- Photos policies
CREATE POLICY "Users can view photos in accessible events" ON photos FOR SELECT USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN newsletters n ON e.newsletter_id = n.id
    WHERE n.group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Users can upload photos to accessible events" ON photos FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND
  event_id IN (
    SELECT e.id FROM events e
    JOIN newsletters n ON e.newsletter_id = n.id
    WHERE n.group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Photo uploaders can update their photos" ON photos FOR UPDATE USING (uploaded_by = auth.uid());
CREATE POLICY "Photo uploaders can delete their photos" ON photos FOR DELETE USING (uploaded_by = auth.uid());

-- Newsletter collaborators policies
CREATE POLICY "Users can view newsletter collaborators" ON newsletter_collaborators FOR SELECT USING (
  newsletter_id IN (
    SELECT id FROM newsletters
    WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Newsletter owners can manage collaborators" ON newsletter_collaborators FOR ALL USING (
  newsletter_id IN (
    SELECT newsletter_id FROM newsletter_collaborators
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);
```

## 5. Storage Setup

### Create Storage Buckets

```sql
-- Create photos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
```

### Storage Policies

```sql
-- Photos bucket policies
CREATE POLICY "Users can upload photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view photos in their groups" ON storage.objects FOR SELECT USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] IN (
    SELECT DISTINCT gm.user_id::text
    FROM group_members gm
    WHERE gm.group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 6. Authentication Configuration

1. Go to Authentication > Settings
2. Configure Site URL: `http://localhost:3000` (for development)
3. Add production URL when deploying: `https://your-app.netlify.app`
4. Enable Email Auth
5. Disable Email Confirmations (since it's invitation-only)
6. Configure Email Templates (optional)

## 7. Environment Variables

Create a `.env` file in your React app root:

```env
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## 8. Test Data (Optional)

```sql
-- Insert test data (run after setting up a test user)
-- Replace 'your-user-id' with actual user ID from auth.users

-- Test friend group
INSERT INTO friend_groups (name, description, invite_code, created_by)
VALUES ('Test Group', 'A test group for development', 'TESTCODE', 'your-user-id');

-- Add user to group
INSERT INTO group_members (group_id, user_id, role)
VALUES (
  (SELECT id FROM friend_groups WHERE invite_code = 'TESTCODE'),
  'your-user-id',
  'admin'
);
```

Your Supabase backend is now ready for the photo newsletter app!
