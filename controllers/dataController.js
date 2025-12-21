const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_key');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Initialize Supabase
let supabase;
try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http')) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    } else {
        console.warn('Supabase URL missing or invalid, skipping initialization');
        supabase = {
            from: () => ({
                select: () => ({ data: [], error: null }),
                insert: () => ({ data: [], error: null }),
                delete: () => ({ error: null }),
                eq: () => ({ data: [], error: null }) // Mock chain
            })
        };
    }
} catch (e) {
    console.warn('Supabase initialization failed:', e.message);
}



exports.saveArticle = async (req, res) => {
    const { user_id, title, summary, sentiment, url } = req.body;

    try {
        const { data, error } = await supabase
            .from('saved_articles')
            .insert([
                { user_id, title, summary: JSON.stringify(summary), sentiment, url }
            ])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Article saved', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSavedArticles = async (req, res) => {
    const { user_id } = req.query; // Assuming we filter by user_id

    try {
        let query = supabase.from('saved_articles').select('*');
        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Parse summary back to array if it was stored as stringified JSON
        const formattedData = data.map(item => ({
            ...item,
            summary: typeof item.summary === 'string' ? JSON.parse(item.summary) : item.summary
        }));

        res.json({ data: formattedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSavedArticle = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('saved_articles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Article deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
