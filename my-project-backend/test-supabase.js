require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseKey ? supabaseKey.length : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try to select from the table
        const { data, error } = await supabase
            .from('saved_articles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Connected and queried table.');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
