const ApiKey = require('../models/ApiKey.model');
const rateLimit = require('express-rate-limit');

// Middleware to authenticate API requests
exports.authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const apiSecret = req.headers['x-api-secret'];

        if (!apiKey || !apiSecret) {
            return res.status(401).json({
                success: false,
                error: 'Missing API credentials',
                message: 'X-API-Key and X-API-Secret headers are required'
            });
        }

        // Find API key
        const apiKeyDoc = await ApiKey.findOne({ key: apiKey }).populate('shipper');

        if (!apiKeyDoc) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        // Verify secret
        if (!apiKeyDoc.verifySecret(apiSecret)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API secret'
            });
        }

        // Check if API key is valid
        if (!apiKeyDoc.isValid()) {
            return res.status(401).json({
                success: false,
                error: 'API key is inactive or expired'
            });
        }

        // Check IP whitelist
        if (apiKeyDoc.ipWhitelist && apiKeyDoc.ipWhitelist.length > 0) {
            const clientIp = req.ip || req.connection.remoteAddress;
            if (!apiKeyDoc.ipWhitelist.includes(clientIp)) {
                return res.status(403).json({
                    success: false,
                    error: 'IP address not whitelisted'
                });
            }
        }

        // Check rate limit
        const rateLimitCheck = apiKeyDoc.checkRateLimit();
        if (!rateLimitCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: rateLimitCheck.reason,
                limit: apiKeyDoc.rateLimit.requestsPerDay,
                usage: apiKeyDoc.usage.requestsToday
            });
        }

        // Increment usage (async, don't wait)
        apiKeyDoc.incrementUsage().catch(err => {
            console.error('Error incrementing API usage:', err);
        });

        // Attach API key and shipper to request
        req.apiKey = apiKeyDoc;
        req.apiShipper = apiKeyDoc.shipper;

        next();
    } catch (error) {
        console.error('API authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
};

// Middleware to check specific permission
exports.requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.apiKey) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        if (!req.apiKey.hasPermission(permission)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                required: permission
            });
        }

        next();
    };
};

// Rate limiter for API endpoints
exports.apiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req) => {
        return req.apiKey ? req.apiKey.rateLimit.requestsPerMinute : 10;
    },
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.apiKey, // Skip if no API key (will be caught by auth middleware)
    keyGenerator: (req) => req.apiKey ? req.apiKey.key : req.ip
});
