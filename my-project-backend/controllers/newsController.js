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
        const mockBuilder = {
            data: [],
            error: null,
            select: () => Promise.resolve({ data: [], error: null }),
            insert: () => mockBuilder,
            delete: () => mockBuilder,
            eq: () => mockBuilder
        };
        supabase = {
            from: () => mockBuilder
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

        res.status(201).json({ message: 'Article saved successfully', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSavedArticles = async (req, res) => {
    const { userId } = req.params;

    try {
        const { data, error } = await supabase
            .from('saved_articles')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Parse summary back to array if it was stored as stringified JSON
        const formattedData = data.map(item => ({
            ...item,
            summary: typeof item.summary === 'string' ? JSON.parse(item.summary) : item.summary
        }));

        res.json({ articles: formattedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.analyzeNews = async (req, res) => {
    const { topic, language } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required in request body' });
    }

    try {
        // 1. Fetch from NewsAPI
        const newsResponse = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: topic,
                apiKey: process.env.NEWS_API_KEY,
                language: language || 'en',
                sortBy: 'publishedAt',
                pageSize: 5
            }
        });

        const articles = newsResponse.data.articles;
        const processedArticles = [];

        // 2. Process with Gemini
        for (const article of articles) {
            if (!article.content && !article.description) continue;

            const contentToAnalyze = article.content || article.description;

            const prompt = `
        Summarize this in 3 bullet points and determine sentiment:
        "${contentToAnalyze}"

        Return the response in this JSON format ONLY:
        {
          "summary": ["bullet 1", "bullet 2", "bullet 3"],
          "sentiment": "Positive/Negative/Neutral"
        }
      `;

            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean up markdown code blocks if present
                const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(jsonString);

                processedArticles.push({
                    ...article,
                    ai_summary: analysis.summary,
                    ai_sentiment: analysis.sentiment
                });
            } catch (aiError) {
                console.error("AI Error for article:", aiError);
                processedArticles.push({
                    ...article,
                    ai_summary: ["AI analysis failed"],
                    ai_sentiment: "Unknown"
                });
            }
        }

        res.json({ articles: processedArticles });

    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
};
