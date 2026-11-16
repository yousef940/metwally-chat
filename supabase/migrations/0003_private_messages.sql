-- ==============================================================================
-- 0003_private_messages.sql: Private Messaging Enhancements
-- Description: Adds conversation_mutes table for notification muting,
--              ensures RLS policies and indexes for high performance 1-to-1 chat.
-- ==============================================================================

-- 1. Conversation Mutes Table
CREATE TABLE IF NOT EXISTS public.conversation_mutes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

-- 2. Enable RLS
ALTER TABLE public.conversation_mutes ENABLE ROW LEVEL SECURITY;

-- 3. Mute RLS Policies
DROP POLICY IF EXISTS "conversation_mutes_all" ON public.conversation_mutes;
CREATE POLICY "conversation_mutes_all" ON public.conversation_mutes
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Fast Lookup Index for conversation mutes
CREATE INDEX IF NOT EXISTS idx_conversation_mutes_user 
  ON public.conversation_mutes(user_id, conversation_id);
