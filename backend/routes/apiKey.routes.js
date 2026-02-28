const express = require('express');
const router = express.Router();
const {
    getApiKeys,
    createApiKey,
    updateApiKey,
    revokeApiKey,
    getApiKeyStats,
    regenerateSecret
} = require('../controllers/apiKey.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// API key management routes
router.get('/', getApiKeys);
router.post('/', createApiKey);
router.put('/:id', updateApiKey);
router.delete('/:id', revokeApiKey);
router.get('/:id/stats', getApiKeyStats);
router.post('/:id/regenerate', regenerateSecret);

module.exports = router;
