const db = require('../config/database');

class Message {
    static async bulkCreate(messages) {
        if (messages.length === 0) return [];

        const values = messages.map((msg, idx) => {
            const offset = idx * 8;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
        }).join(',');

        const params = messages.flatMap(msg => [
            msg.chatId,
            msg.senderName,
            msg.senderIsMe,
            msg.timestamp,
            msg.body,
            msg.messageType,
            msg.orderIndex,
            JSON.stringify(msg.metadata || {})
        ]);

        const query = `
      INSERT INTO messages (chat_id, sender_name, sender_is_me, timestamp, body, message_type, order_index, metadata)
      VALUES ${values}
      RETURNING *
    `;

        const result = await db.query(query, params);
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

    static async search(chatId, query, limit = 50) {
        const result = await db.query(
            `SELECT * FROM messages 
       WHERE chat_id = $1 AND to_tsvector('english', body) @@ plainto_tsquery('english', $2)
       ORDER BY order_index ASC
       LIMIT $3`,
            [chatId, query, limit]
        );
        return result.rows;
    }
}

module.exports = Message;
