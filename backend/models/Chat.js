const db = require('../config/database');

class Chat {
    static async create(userId, chatName, originalFilename, uploadUuid) {
        const result = await db.query(
            `INSERT INTO chats (user_id, chat_name, original_filename, upload_uuid, parse_status) 
       VALUES ($1, $2, $3, $4, 'processing') 
       RETURNING *`,
            [userId, chatName, originalFilename, uploadUuid]
        );
        return result.rows[0];
    }

    static async findByUser(userId, limit = 50, offset = 0) {
        const result = await db.query(
            `SELECT c.*, 
              (SELECT body FROM messages WHERE chat_id = c.id ORDER BY order_index DESC LIMIT 1) as last_message,
              (SELECT timestamp FROM messages WHERE chat_id = c.id ORDER BY order_index DESC LIMIT 1) as last_message_time
       FROM chats c 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    static async findById(id, userId) {
        const result = await db.query(
            'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return result.rows[0];
    }

    static async updateParseStatus(id, status, error = null) {
        await db.query(
            'UPDATE chats SET parse_status = $1, parse_error = $2 WHERE id = $3',
            [status, error, id]
        );
    }

    static async updateStats(id, messageCount, sizeBytes) {
        await db.query(
            'UPDATE chats SET message_count = $1, size_bytes = $2 WHERE id = $3',
            [messageCount, sizeBytes, id]
        );
    }

    static async delete(id, userId) {
        const result = await db.query(
            'DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );
        return result.rows[0];
    }

    static async count(userId) {
        const result = await db.query(
            'SELECT COUNT(*) FROM chats WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = Chat;
