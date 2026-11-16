/**
 * Shapes shared between the room pages and the room components.
 * They live here so the pages and the components agree on one definition
 * instead of importing types from each other.
 */

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country: string | null;
  topic: string | null;
  is_active: boolean;
  pinned_message_id?: string | null;
  created_at: string;
}

/** Public shape of a member profile, as shown next to their messages. */
export interface ChatProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  gender: "male" | "female" | null;
}

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: ChatProfile | null;
  reactions?: ChatMessageReaction[];
}
