const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');



// Saved Articles Routes
router.post('/articles', dataController.saveArticle);
router.get('/articles', dataController.getSavedArticles);
router.delete('/articles/:id', dataController.deleteSavedArticle);

module.exports = router;
