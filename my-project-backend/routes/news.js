const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.post('/analyze', newsController.analyzeNews);
router.post('/save', newsController.saveArticle);
router.get('/saved/:userId', newsController.getSavedArticles);

module.exports = router;
