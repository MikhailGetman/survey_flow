const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
    static async create({ email, password, name }) {
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [email, passwordHash, name]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, email, name, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async validatePassword(user, password) {
        return bcrypt.compare(password, user.password_hash);
    }

    static async createResetToken(email) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);
        
        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [token, expires, email]
        );
        
        return token;
    }

    static async findByResetToken(token) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );
        return rows[0];
    }

    static async updatePassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [passwordHash, id]
        );
    }
}

module.exports = User;
