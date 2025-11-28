const db = require('../config/database');

class MediaFile {
    static async create(messageId, chatId, userId, originalName, storagePath, thumbPath, mimeType, sizeBytes) {
        const result = await db.query(
            `INSERT INTO media_files (message_id, chat_id, user_id, original_name, storage_path, thumb_path, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [messageId, chatId, userId, originalName, storagePath, thumbPath, mimeType, sizeBytes]
        );
        return result.rows[0];
    }

    static async bulkCreate(mediaFiles) {
        if (mediaFiles.length === 0) return [];

        const values = mediaFiles.map((file, idx) => {
            const offset = idx * 8;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
        }).join(',');

        const params = mediaFiles.flatMap(file => [
            file.messageId,
            file.chatId,
            file.userId,
            file.originalName,
            file.storagePath,
            file.thumbPath || null,
            file.mimeType,
            file.sizeBytes
        ]);

        const query = `
      INSERT INTO media_files (message_id, chat_id, user_id, original_name, storage_path, thumb_path, mime_type, size_bytes)
      VALUES ${values}
      RETURNING *
    `;

        const result = await db.query(query, params);
        return result.rows;
    }

    static async findByMessage(messageId) {
        const result = await db.query(
            'SELECT * FROM media_files WHERE message_id = $1',
            [messageId]
        );
        return result.rows;
    }

    static async findByChat(chatId) {
        const result = await db.query(
            'SELECT * FROM media_files WHERE chat_id = $1',
            [chatId]
        );
        return result.rows;
    }

    static async findById(id, userId) {
        const result = await db.query(
            'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        return result.rows[0];
    }

    static async deleteByChat(chatId) {
        await db.query('DELETE FROM media_files WHERE chat_id = $1', [chatId]);
    }

    static async getTotalSizeByUser(userId) {
        const result = await db.query(
            'SELECT COALESCE(SUM(size_bytes), 0) as total_size FROM media_files WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].total_size);
    }
}

module.exports = MediaFile;
