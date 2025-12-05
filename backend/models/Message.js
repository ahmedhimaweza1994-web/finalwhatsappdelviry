const db = require('../config/database');

class Message {
    static async bulkCreate(messages) {
        if (messages.length === 0) return [];

        const placeholders = [];
        const values = [];
        let paramIndex = 1;

        messages.forEach((msg) => {
            const msgValues = [
                msg.chatId,
                msg.senderName,
                msg.senderIsMe,
                msg.timestamp,
                msg.body,
                msg.messageType,
                msg.orderIndex,
                JSON.stringify(msg.metadata || {})
            ];
            placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
            values.push(...msgValues);
            paramIndex += 8;
        });

        const query = `INSERT INTO messages (chat_id, sender_name, sender_is_me, timestamp, body, message_type, order_index, metadata) 
                      VALUES ${placeholders.join(', ')} 
                      RETURNING *`;
        const result = await db.query(query, values);
        return result.rows;
    }

    static async findByChatPaginated(chatId, limit = 50, offset = 0) {
        const result = await db.query(
            `SELECT m.*, 
              json_agg(json_build_object(
                'id', mf.id,
                'original_name', mf.original_name,
                'storage_path', mf.storage_path,
                'thumb_path', mf.thumb_path,
                'mime_type', mf.mime_type,
                'size_bytes', mf.size_bytes
              )) FILTER (WHERE mf.id IS NOT NULL) as media
       FROM messages m
       LEFT JOIN media_files mf ON mf.message_id = m.id
       WHERE m.chat_id = $1
       GROUP BY m.id
       ORDER BY m.timestamp DESC, m.order_index DESC
       LIMIT $2 OFFSET $3`,
            [chatId, limit, offset]
        );
        return result.rows.reverse(); // Reverse to show oldest first in the returned batch
    }

    static async countByChat(chatId) {
        const result = await db.query(
            'SELECT COUNT(*) FROM messages WHERE chat_id = $1',
            [chatId]
        );
        return parseInt(result.rows[0].count);
    }

    static async deleteByChat(chatId) {
        await db.query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
    }

    // Search messages in a chat (supports Arabic and English)
    // Counts each occurrence of the search term (like WhatsApp does)
    static async searchInChat(chatId, searchQuery, limit = 10000) {
        const result = await db.query(
            `WITH message_occurrences AS (
                SELECT 
                    m.*,
                    json_agg(json_build_object(
                        'id', mf.id,
                        'original_name', mf.original_name,
                        'storage_path', mf.storage_path,
                        'thumb_path', mf.thumb_path,
                        'mime_type', mf.mime_type,
                        'size_bytes', mf.size_bytes
                    )) FILTER (WHERE mf.id IS NOT NULL) as media,
                    -- Count how many times the search term appears in body
                    (LENGTH(m.body) - LENGTH(REPLACE(LOWER(m.body), LOWER($2), ''))) / LENGTH($2) as body_count,
                    -- Count how many times the search term appears in sender_name
                    (LENGTH(m.sender_name) - LENGTH(REPLACE(LOWER(m.sender_name), LOWER($2), ''))) / LENGTH($2) as sender_count
                FROM messages m
                LEFT JOIN media_files mf ON mf.message_id = m.id
                WHERE m.chat_id = $1 AND (m.body ILIKE $3 OR m.sender_name ILIKE $3)
                GROUP BY m.id
            ),
            expanded_results AS (
                SELECT 
                    mo.*,
                    -- Generate a row for each occurrence
                    generate_series(1, GREATEST(mo.body_count, mo.sender_count)::integer) as occurrence_num
                FROM message_occurrences mo
            )
            SELECT 
                id, chat_id, sender_name, sender_is_me, timestamp, body, 
                message_type, order_index, metadata, created_at, is_pinned, 
                pinned_at, media
            FROM expanded_results
            ORDER BY timestamp DESC
            LIMIT $4`,
            [chatId, searchQuery, `%${searchQuery}%`, limit]
        );
        return result.rows;
    }

    // Toggle pin status for a message
    static async togglePin(messageId, chatId) {
        const result = await db.query(
            `UPDATE messages 
             SET is_pinned = NOT COALESCE(is_pinned, FALSE),
                 pinned_at = CASE 
                   WHEN NOT COALESCE(is_pinned, FALSE) THEN CURRENT_TIMESTAMP 
                   ELSE NULL 
                 END
             WHERE id = $1 AND chat_id = $2
             RETURNING *`,
            [messageId, chatId]
        );
        return result.rows[0];
    }

    // Get all pinned messages for a chat
    static async getPinnedMessages(chatId) {
        const result = await db.query(
            `SELECT m.*, 
              json_agg(json_build_object(
                'id', mf.id,
                'original_name', mf.original_name,
                'storage_path', mf.storage_path,
                'thumb_path', mf.thumb_path,
                'mime_type', mf.mime_type,
                'size_bytes', mf.size_bytes
              )) FILTER (WHERE mf.id IS NOT NULL) as media
       FROM messages m
       LEFT JOIN media_files mf ON mf.message_id = m.id
       WHERE m.chat_id = $1 AND m.is_pinned = TRUE
       GROUP BY m.id
       ORDER BY m.pinned_at DESC
       LIMIT 10`,
            [chatId]
        );
        return result.rows;
    }
}

module.exports = Message;
