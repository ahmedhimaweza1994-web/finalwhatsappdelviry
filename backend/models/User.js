const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async create(email, password) {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
            [email, passwordHash]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT id, email, created_at, last_login FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    static async updateLastLogin(id) {
        await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
    }

    static async updatePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $1',
            [passwordHash, id]
        );
    }
}

module.exports = User;
