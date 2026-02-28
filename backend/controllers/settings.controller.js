const Settings = require('../models/Settings.model');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.find();

        const response = {
            general: null,
            system: null,
            pricing: null
        };

        settings.forEach(setting => {
            response[setting.key] = setting.data;
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get settings by key
// @route   GET /api/settings/:key
// @access  Private
exports.getSettingsByKey = async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found'
            });
        }

        res.status(200).json(setting.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update or create settings
// @route   PUT /api/settings/:key
// @access  Private
exports.updateSettings = async (req, res) => {
    try {
        const { key } = req.params;
        const data = req.body;

        let setting = await Settings.findOne({ key });

        if (setting) {
            setting.data = data;
            setting.updatedBy = req.user._id;
            await setting.save();
        } else {
            setting = await Settings.create({
                key,
                data,
                updatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: setting.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete settings
// @route   DELETE /api/settings/:key
// @access  Private
exports.deleteSettings = async (req, res) => {
    try {
        const setting = await Settings.findOneAndDelete({ key: req.params.key });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Settings deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
