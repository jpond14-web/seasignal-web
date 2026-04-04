import type { Json } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";

// Conversation detail types
export type Reactions = Record<string, string[]>; // emoji -> profileId[]
export type Attachment = { name: string; url: string; type: string; size: number };

export type Message = {
  id: string;
  sender_id: string;
  plaintext: string | null;
  ciphertext: string | null;
  message_type: string;
  reply_to_id: string | null;
  reactions: Json;
  attachments: Json;
  edited_at: string | null;
  expires_at: string | null;
  created_at: string;
  profiles?: { display_name: string } | null;
};

export type MemberProfile = {
  profile_id: string;
  display_name: string;
  last_seen_at: string | null;
  last_read_at: string | null;
};

// Conversation list types
export type ConversationType = Database["public"]["Enums"]["conversation_type"];
export type DepartmentType = Database["public"]["Enums"]["department_type"];
export type RankCategory = Database["public"]["Enums"]["rank_category"];
export type VesselType = Database["public"]["Enums"]["vessel_type"];

export type ConversationWithMeta = {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  context_port: string | null;
  updated_at: string;
  is_encrypted: boolean | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_by: string | null;
  max_members: number | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  is_muted?: boolean;
  last_read_at?: string | null;
  unread_count?: number;
  dm_partner_name?: string;
  dm_partner_online?: boolean;
  member_count?: number;
};

export type FoundUser = {
  id: string;
  display_name: string;
  department_tag: DepartmentType | null;
  rank_range: RankCategory | null;
  vessel_type_tags: VesselType[] | null;
  last_seen_at: string | null;
};
