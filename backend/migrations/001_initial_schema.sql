-- ChatVault Database Schema
-- Version: 1.0.0
-- Created: 2025-11-25

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  upload_uuid UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  parse_status VARCHAR(50) DEFAULT 'pending',
  parse_error TEXT
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_name VARCHAR(255),
  sender_is_me BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL,
  body TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  order_index INTEGER NOT NULL,
  metadata JSONB,
  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'link', 'system'))
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(255),
  storage_path VARCHAR(500) NOT NULL,
  thumb_path VARCHAR(500),
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_order ON messages(chat_id, order_index);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_media_chat ON media_files(chat_id);
CREATE INDEX IF NOT EXISTS idx_media_message ON media_files(message_id);
CREATE INDEX IF NOT EXISTS idx_media_user ON media_files(user_id);

-- Full-text search index for messages (optional, for search feature)
CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(to_tsvector('english', body));

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash) 
VALUES ('admin@chatvault.local', '$2b$10$rKqZN8z9kX5J.8vN8qZN8eT7GqZN8z9kX5J.8vN8qZN8z9kX5J.8u')
ON CONFLICT (email) DO NOTHING;

-- Create a function to update message count
CREATE OR REPLACE FUNCTION update_chat_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chats SET message_count = message_count + 1 WHERE id = NEW.chat_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chats SET message_count = message_count - 1 WHERE id = OLD.chat_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message count
DROP TRIGGER IF EXISTS trigger_update_message_count ON messages;
CREATE TRIGGER trigger_update_message_count
  AFTER INSERT OR DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_message_count();

COMMENT ON TABLE users IS 'Registered users of the application';
COMMENT ON TABLE chats IS 'Uploaded WhatsApp chat exports';
COMMENT ON TABLE messages IS 'Individual messages from each chat';
COMMENT ON TABLE media_files IS 'Media files (images, videos, audio, documents) attached to messages';
