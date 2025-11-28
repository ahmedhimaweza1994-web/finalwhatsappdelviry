const fs = require('fs').promises;
const path = require('path');
const db = require('../backend/config/database');

const MIGRATIONS_DIR = path.join(__dirname, '../backend/migrations');

/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

async function runMigrations() {
    try {
        console.log('Running database migrations...');

        const files = await fs.readdir(MIGRATIONS_DIR);

        // Filter and sort SQL files
        const sqlFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of sqlFiles) {
            console.log(`  Applying: ${file}`);

            const filePath = path.join(MIGRATIONS_DIR, file);
            const sql = await fs.readFile(filePath, 'utf-8');

            await db.query(sql);

            console.log(`  ✓ ${file} applied successfully`);
        }

        console.log('✓ All migrations completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await db.pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
