export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Nullable<T> = T | null;

export interface Database {
  public: {
    Tables: {
      profiles: {
      Row: {
        id: string;
        email: string;
        display_name: Nullable<string>;
        avatar_url: Nullable<string>;
        created_at: string;
        updated_at: string;
      };
        Insert: {
          id: string;
          email: string;
          display_name?: Nullable<string>;
          avatar_url?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
        display_name?: Nullable<string>;
        avatar_url?: Nullable<string>;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
      friend_groups: {
      Row: {
        id: string;
        name: string;
        description: Nullable<string>;
        invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: Nullable<string>;
          invite_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: Nullable<string>;
        invite_code?: string;
        created_by?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
      group_members: {
      Row: {
        id: string;
        group_id: string;
        user_id: string;
        role: 'admin' | 'member';
        joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
        role?: 'admin' | 'member';
        joined_at?: string;
      };
      Relationships: [];
    };
      newsletters: {
      Row: {
        id: string;
        title: string;
        description: Nullable<string>;
        group_id: string;
          layout: Nullable<Database['public']['Enums']['newsletter_layout']>;
          is_published: boolean;
          published_at: Nullable<string>;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: Nullable<string>;
          group_id: string;
          layout?: Nullable<Database['public']['Enums']['newsletter_layout']>;
          is_published?: boolean;
          published_at?: Nullable<string>;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: Nullable<string>;
          group_id?: string;
          layout?: Nullable<Database['public']['Enums']['newsletter_layout']>;
          is_published?: boolean;
        published_at?: Nullable<string>;
        created_by?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
      newsletter_collaborators: {
      Row: {
        id: string;
        newsletter_id: string;
        user_id: string;
        role: 'owner' | 'editor' | 'collaborator';
          added_at: string;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          user_id: string;
          role?: 'owner' | 'editor' | 'collaborator';
          added_at?: string;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
        user_id?: string;
        role?: 'owner' | 'editor' | 'collaborator';
        added_at?: string;
      };
      Relationships: [];
    };
      events: {
      Row: {
        id: string;
        newsletter_id: string;
        title: string;
        description: Nullable<string>;
          event_date: Nullable<string>;
          location: Nullable<string>;
          category: Nullable<Database['public']['Enums']['event_category']>;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          newsletter_id: string;
          title: string;
          description?: Nullable<string>;
          event_date?: Nullable<string>;
          location?: Nullable<string>;
          category?: Nullable<Database['public']['Enums']['event_category']>;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          newsletter_id?: string;
          title?: string;
          description?: Nullable<string>;
          event_date?: Nullable<string>;
          location?: Nullable<string>;
        category?: Nullable<Database['public']['Enums']['event_category']>;
        created_by?: string;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
      event_attendees: {
      Row: {
        id: string;
        event_id: string;
        user_id: string;
        created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
        event_id?: string;
        user_id?: string;
        created_at?: string;
      };
      Relationships: [];
    };
      photos: {
      Row: {
        id: string;
        event_id: string;
        file_path: string;
        file_name: string;
          file_size: Nullable<number>;
          mime_type: Nullable<string>;
          caption: Nullable<string>;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          file_path: string;
          file_name: string;
          file_size?: Nullable<number>;
          mime_type?: Nullable<string>;
          caption?: Nullable<string>;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: Nullable<number>;
          mime_type?: Nullable<string>;
        caption?: Nullable<string>;
        uploaded_by?: string;
        created_at?: string;
      };
      Relationships: [];
    };
      story_archives: {
      Row: {
        id: string;
        user_id: string;
        title: Nullable<string>;
        prompt: Nullable<string>;
          article: Nullable<string>;
          image_path: Nullable<string>;
          photo_id: Nullable<string>;
          template_id: Nullable<string>;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: Nullable<string>;
          prompt?: Nullable<string>;
          article?: Nullable<string>;
          image_path?: Nullable<string>;
          photo_id?: Nullable<string>;
          template_id?: Nullable<string>;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: Nullable<string>;
          prompt?: Nullable<string>;
          article?: Nullable<string>;
          image_path?: Nullable<string>;
          photo_id?: Nullable<string>;
          template_id?: Nullable<string>;
        is_public?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Relationships: [];
    };
      templates: {
      Row: {
        id: string;
        title: string;
        slug: string;
        html: string;
          css: Nullable<string>;
          is_system: Nullable<boolean>;
          owner: Nullable<string>;
          created_at: string;
          updated_at: string;
          is_public: Nullable<boolean>;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          html: string;
          css?: Nullable<string>;
          is_system?: Nullable<boolean>;
          owner?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          is_public?: Nullable<boolean>;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          html?: string;
          css?: Nullable<string>;
          is_system?: Nullable<boolean>;
          owner?: Nullable<string>;
        created_at?: string;
        updated_at?: string;
        is_public?: Nullable<boolean>;
      };
      Relationships: [];
    };
    };
    Views: {
      templates_public: {
        Row: {
          id: string;
          slug: Nullable<string>;
          title: string;
          description: Nullable<string>;
          html: string;
          css: Nullable<string>;
          is_system: Nullable<boolean>;
          owner: Nullable<string>;
          created_at: Nullable<string>;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      event_category: 'social' | 'travel' | 'food' | 'celebration' | 'sports' | 'cultural';
      newsletter_layout:
        | 'grid'
        | 'timeline'
        | 'magazine'
        | 'polaroid'
        | 'minimal'
        | 'scrapbook';
    };
    CompositeTypes: Record<string, never>;
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          name: string;
          owner: Nullable<string>;
          created_at: string;
          updated_at: string;
          public: boolean;
          file_size_limit: Nullable<number>;
          allowed_mime_types: Nullable<string[]>;
        };
        Insert: {
          id?: string;
          name: string;
          owner?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          public?: boolean;
          file_size_limit?: Nullable<number>;
          allowed_mime_types?: Nullable<string[]>;
        };
        Update: {
          id?: string;
          name?: string;
          owner?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          public?: boolean;
          file_size_limit?: Nullable<number>;
          allowed_mime_types?: Nullable<string[]>;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          id: string;
          bucket_id: Nullable<string>;
          name: string;
          owner: Nullable<string>;
          created_at: string;
          updated_at: string;
          last_accessed_at: Nullable<string>;
          metadata: Nullable<Json>;
          path_tokens: Nullable<string[]>;
        };
        Insert: {
          id?: string;
          bucket_id?: Nullable<string>;
          name: string;
          owner?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          last_accessed_at?: Nullable<string>;
          metadata?: Nullable<Json>;
          path_tokens?: Nullable<string[]>;
        };
        Update: {
          id?: string;
          bucket_id?: Nullable<string>;
          name?: string;
          owner?: Nullable<string>;
          created_at?: string;
          updated_at?: string;
          last_accessed_at?: Nullable<string>;
          metadata?: Nullable<Json>;
          path_tokens?: Nullable<string[]>;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
