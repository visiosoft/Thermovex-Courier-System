const Exception = require('../models/Exception.model');
const Booking = require('../models/Booking.model');

// @desc    Get all exceptions
// @route   GET /api/exceptions
// @access  Private
exports.getAllExceptions = async (req, res) => {
  try {
    const { status, type, priority, awbNumber, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (awbNumber) query.awbNumber = { $regex: awbNumber, $options: 'i' };

    const exceptions = await Exception.find(query)
      .populate('booking', 'awbNumber status')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ reportedAt: -1 });

    const count = await Exception.countDocuments(query);

    res.status(200).json({
      success: true,
      data: exceptions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single exception
// @route   GET /api/exceptions/:id
// @access  Private/Public
exports.getExceptionById = async (req, res) => {
  try {
    const exception = await Exception.findById(req.params.id)
      .populate('booking')
      .populate('assignedTo', 'name email mobile')
      .populate('resolvedBy', 'name')
      .populate('internalNotes.addedBy', 'name');

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Report new exception
// @route   POST /api/exceptions
// @access  Public/Private
exports.reportException = async (req, res) => {
  try {
    const { awbNumber, type, description, reportedBy, priority: requestPriority } = req.body;

    // Find booking
    const booking = await Booking.findOne({ awbNumber });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found with provided AWB number'
      });
    }

    // Determine priority based on type or use provided priority
    let priority = requestPriority || 'Medium';
    if (!requestPriority) {
      if (['Package Lost', 'Damaged Package', 'Missing Items'].includes(type)) {
        priority = 'High';
      }
      if (type === 'Delivery Refused') {
        priority = 'Urgent';
      }
    }

    // Handle reportedBy - can be a string or object
    let reportedByData = reportedBy;
    if (typeof reportedBy === 'string') {
      reportedByData = {
        name: reportedBy,
        relationship: 'Customer Support'
      };
    }

    const exception = await Exception.create({
      booking: booking._id,
      awbNumber,
      type,
      description,
      reportedBy: reportedByData,
      priority
    });

    // Update booking status if needed
    if (['Package Lost', 'Damaged Package'].includes(type) && booking.status !== 'On Hold') {
      await booking.addStatusUpdate(
        'On Hold',
        '',
        `Exception reported: ${type}`,
        req.user?._id
      );
    }

    res.status(201).json({
      success: true,
      message: 'Exception reported successfully',
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update exception
// @route   PUT /api/exceptions/:id
// @access  Private
exports.updateException = async (req, res) => {
  try {
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    Object.assign(exception, req.body);
    await exception.save();

    res.status(200).json({
      success: true,
      message: 'Exception updated successfully',
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign exception
// @route   PUT /api/exceptions/:id/assign
// @access  Private
exports.assignException = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    exception.assignedTo = assignedTo;
    exception.assignedAt = new Date();
    exception.status = 'In Progress';
    await exception.save();

    res.status(200).json({
      success: true,
      message: 'Exception assigned successfully',
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resolve exception
// @route   PUT /api/exceptions/:id/resolve
// @access  Private
exports.resolveException = async (req, res) => {
  try {
    const { resolution } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    exception.resolution = resolution;
    exception.status = 'Resolved';
    exception.resolvedBy = req.user._id;
    exception.resolvedAt = new Date();
    await exception.save();

    res.status(200).json({
      success: true,
      message: 'Exception resolved successfully',
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add internal note
// @route   POST /api/exceptions/:id/notes
// @access  Private
exports.addNote = async (req, res) => {
  try {
    const { note } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    exception.internalNotes.push({
      note,
      addedBy: req.user._id,
      timestamp: new Date()
    });

    await exception.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: exception
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete exception
// @route   DELETE /api/exceptions/:id
// @access  Private
exports.deleteException = async (req, res) => {
  try {
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found'
      });
    }

    await exception.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exception deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
