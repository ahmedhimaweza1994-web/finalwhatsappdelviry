#!/bin/bash

# Script to clear all chats and media files from ChatVault
# WARNING: This will delete ALL user data permanently!

echo "⚠️  WARNING: This will delete ALL chats and media files from ALL users!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Clearing database..."

# Clear all tables (keeps users, deletes chats, messages, media)
docker compose exec -T postgres psql -U chatvault -d chatvault << EOF
-- Delete all media files records
DELETE FROM media_files;

-- Delete all messages
DELETE FROM messages;

-- Delete all chats
DELETE FROM chats;

-- Reset sequences
ALTER SEQUENCE chats_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE media_files_id_seq RESTART WITH 1;

-- Show counts
SELECT 'Chats remaining: ' || COUNT(*) FROM chats;
SELECT 'Messages remaining: ' || COUNT(*) FROM messages;
SELECT 'Media files remaining: ' || COUNT(*) FROM media_files;
EOF

echo "✅ Database cleared!"

echo "🗑️  Clearing uploaded files..."
docker compose exec backend rm -rf /var/www/chatvault/uploads/*
docker compose exec backend rm -rf /var/www/chatvault/media/*

echo "✅ All files cleared!"

echo "🔄 Restarting services..."
docker compose restart backend worker

echo "✅ Done! All chats and media have been deleted."
echo "Users can now start fresh with new imports."
