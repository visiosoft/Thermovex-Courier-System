const ApiKey = require('../models/ApiKey.model');
const Shipper = require('../models/Shipper.model');

// @desc    Get all API keys
// @route   GET /api/api-keys
// @access  Private
exports.getApiKeys = async (req, res) => {
    try {
        const query = req.user.role?.name === 'Super Admin'
            ? {}
            : { shipper: req.user.shipper };

        const apiKeys = await ApiKey.find(query)
            .populate('shipper', 'companyName')
            .populate('createdBy', 'name email')
            .select('-secret')
            .sort({ createdAt: -1 });

        res.json({ apiKeys });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create new API key
// @route   POST /api/api-keys
// @access  Private
exports.createApiKey = async (req, res) => {
    try {
        const {
            name,
            shipperId,
            permissions,
            environment,
            rateLimit,
            ipWhitelist,
            webhookUrl,
            expiresAt,
            notes
        } = req.body;

        // Verify shipper exists
        const shipper = await Shipper.findById(shipperId);
        if (!shipper) {
            return res.status(404).json({ message: 'Shipper not found' });
        }

        // Check if user has permission to create API key for this shipper
        if (req.user.role?.name !== 'Super Admin' && req.user.shipper?.toString() !== shipperId) {
            return res.status(403).json({ message: 'Not authorized to create API key for this shipper' });
        }

        // Generate credentials
        const { key, secret } = ApiKey.generateCredentials();
        const plainSecret = secret; // Store for response only

        // Create API key
        const apiKey = await ApiKey.create({
            name,
            key,
            secret,
            shipper: shipperId,
            permissions: permissions || ['booking.create', 'booking.read', 'tracking.read', 'rate.calculate'],
            environment: environment || 'sandbox',
            rateLimit: rateLimit || { requestsPerMinute: 60, requestsPerDay: 10000 },
            ipWhitelist: ipWhitelist || [],
            webhookUrl,
            expiresAt,
            notes,
            createdBy: req.user._id,
            status: 'Active'
        });

        await apiKey.populate('shipper', 'companyName');

        res.status(201).json({
            message: 'API key created successfully',
            apiKey: {
                id: apiKey._id,
                name: apiKey.name,
                key: apiKey.key,
                secret: plainSecret, // Only shown once
                shipper: apiKey.shipper,
                permissions: apiKey.permissions,
                environment: apiKey.environment,
                createdAt: apiKey.createdAt
            },
            warning: 'Please save the secret key securely. It will not be shown again.'
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update API key
// @route   PUT /api/api-keys/:id
// @access  Private
exports.updateApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            permissions,
            status,
            rateLimit,
            ipWhitelist,
            webhookUrl,
            expiresAt,
            notes
        } = req.body;

        const apiKey = await ApiKey.findById(id);
        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        // Check permissions
        if (req.user.role?.name !== 'Super Admin' && req.user.shipper?.toString() !== apiKey.shipper.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        if (name) apiKey.name = name;
        if (permissions) apiKey.permissions = permissions;
        if (status) apiKey.status = status;
        if (rateLimit) apiKey.rateLimit = rateLimit;
        if (ipWhitelist !== undefined) apiKey.ipWhitelist = ipWhitelist;
        if (webhookUrl !== undefined) apiKey.webhookUrl = webhookUrl;
        if (expiresAt !== undefined) apiKey.expiresAt = expiresAt;
        if (notes !== undefined) apiKey.notes = notes;

        await apiKey.save();
        await apiKey.populate('shipper', 'companyName');

        res.json({
            message: 'API key updated successfully',
            apiKey
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Revoke API key
// @route   DELETE /api/api-keys/:id
// @access  Private
exports.revokeApiKey = async (req, res) => {
    try {
        const { id } = req.params;

        const apiKey = await ApiKey.findById(id);
        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        // Check permissions
        if (req.user.role?.name !== 'Super Admin' && req.user.shipper?.toString() !== apiKey.shipper.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        apiKey.status = 'Revoked';
        await apiKey.save();

        res.json({ message: 'API key revoked successfully' });
    } catch (error) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get API key statistics
// @route   GET /api/api-keys/:id/stats
// @access  Private
exports.getApiKeyStats = async (req, res) => {
    try {
        const { id } = req.params;

        const apiKey = await ApiKey.findById(id).populate('shipper', 'companyName');
        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        // Check permissions
        if (req.user.role?.name !== 'Super Admin' && req.user.shipper?.toString() !== apiKey.shipper._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            apiKey: {
                name: apiKey.name,
                shipper: apiKey.shipper.companyName,
                environment: apiKey.environment,
                status: apiKey.status
            },
            usage: {
                totalRequests: apiKey.usage.totalRequests,
                requestsToday: apiKey.usage.requestsToday,
                lastUsed: apiKey.usage.lastUsed,
                dailyLimit: apiKey.rateLimit.requestsPerDay,
                remainingToday: apiKey.rateLimit.requestsPerDay - apiKey.usage.requestsToday
            },
            limits: apiKey.rateLimit
        });
    } catch (error) {
        console.error('Error fetching API key stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Regenerate API secret
// @route   POST /api/api-keys/:id/regenerate
// @access  Private
exports.regenerateSecret = async (req, res) => {
    try {
        const { id } = req.params;

        const apiKey = await ApiKey.findById(id);
        if (!apiKey) {
            return res.status(404).json({ message: 'API key not found' });
        }

        // Check permissions
        if (req.user.role?.name !== 'Super Admin' && req.user.shipper?.toString() !== apiKey.shipper.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Generate new secret
        const { secret } = ApiKey.generateCredentials();
        const plainSecret = secret;
        apiKey.secret = secret;
        await apiKey.save();

        res.json({
            message: 'API secret regenerated successfully',
            key: apiKey.key,
            secret: plainSecret,
            warning: 'Please save the new secret key securely. It will not be shown again.'
        });
    } catch (error) {
        console.error('Error regenerating secret:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
