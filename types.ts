import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      checkins: {
        Row: Checkin;
        Insert: Partial<Checkin>;
        Update: Partial<Checkin>;
      };
      comments: {
        Row: Comment;
        Insert: Partial<Comment>;
        Update: Partial<Comment>;
      };
      guestbook_messages: {
        Row: GuestbookMessage;
        Insert: Partial<GuestbookMessage>;
        Update: Partial<GuestbookMessage>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
      };
    };
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type GuestbookMessage = {
  id: number;
  created_at: string;
  nickname: string;
  message: string;
  user_id: string | null;
  profiles: { is_vip: boolean; vip_until: string | null; } | null;
};

export type Checkin = {
  id: number;
  created_at?: string;
  nickname: string;
  description: string;
  lat: number;
  lon: number;
  city: string | null;
  photo: string | null;
  gender: string | null;
  status: 'Single' | 'Coppia';
  user_id: string | null;
  display_name: string;
  profiles: { is_vip: boolean; vip_until: string | null; } | null;
};

export type Comment = {
  id: number;
  created_at?: string;
  checkin_id: number;
  text: string;
  user_id: string | null;
};

export type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  gender: string | null;
  status: 'Single' | 'Coppia' | null;
  avatar_url: string | null;
  created_at?: string;
  is_vip: boolean;
  vip_until: string | null;
  last_message_sent_at: string | null;
  messages_sent_today: number | null;
};

export type Message = {
  id: number;
  created_at?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  sender: Profile;
  receiver?: Profile;
};

export type User = SupabaseUser;
export type Session = SupabaseSession;

export interface FilterState {
    gender: string;
    city: string;
    vipOnly: boolean;
}