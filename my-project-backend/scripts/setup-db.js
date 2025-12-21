require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is missing in .env');
    console.log('Please get your "Connection String" from Supabase Settings -> Database -> Connection String');
    console.log('And add it to your .env file like this:');
    console.log('DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres"');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await client.query(schemaSql);

        console.log('✅ Table "saved_articles" created successfully!');
    } catch (err) {
        console.error('❌ Database Error:', err.message);
    } finally {
        await client.end();
    }
}

setupDatabase();
