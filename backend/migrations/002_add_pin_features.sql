-- Migration: Add pin features for chats and messages
-- Created: 2025-12-03

-- Add pin columns to chats table
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP;

-- Add pin columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP;

-- Create index for pinned chats (for faster sorting)
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON chats(user_id, is_pinned DESC, pinned_at DESC);

-- Create index for pinned messages (for faster retrieval)
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(chat_id, is_pinned DESC, pinned_at DESC);

COMMENT ON COLUMN chats.is_pinned IS 'Whether this chat is pinned by the user';
COMMENT ON COLUMN chats.pinned_at IS 'When this chat was pinned';
COMMENT ON COLUMN messages.is_pinned IS 'Whether this message is pinned within the chat';
COMMENT ON COLUMN messages.pinned_at IS 'When this message was pinned';
