const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  // First, connect to postgres database to create chatvault database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL');

    // Create database if it doesn't exist
    try {
      await adminClient.query('CREATE DATABASE chatvault;');
      console.log('✓ Database "chatvault" created');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('✓ Database "chatvault" already exists');
      } else {
        throw err;
      }
    }

    await adminClient.end();

    // Now connect to chatvault database to run migrations
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'chatvault'
    });

    await client.connect();
    console.log('Connected to chatvault database');

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);
    console.log('✓ Migration completed successfully');

    await client.end();
    console.log('\n✓ Database setup complete!');
    console.log('\nYou can now start the application with:');
    console.log('  npm run dev (backend)');
    console.log('  npm run worker (worker)');
    console.log('  npm run dev (frontend)');

  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
