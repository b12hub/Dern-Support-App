const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware for validating request data using express-validator
 * @module middleware/validation
 */

/**
 * Validate request data based on express-validator rules
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} - Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    logger.debug(`Validation errors: ${JSON.stringify(formattedErrors)}`);

    // Return validation errors
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

/**
 * Sanitize request data to prevent XSS attacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeData = (req, res, next) => {
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          sanitized[key] = sanitizeInput(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'object' ? sanitizeObject(item) : 
            typeof item === 'string' ? sanitizeInput(item) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate file uploads
 * @param {Object} options - Validation options
 * @param {number} options.maxFiles - Maximum number of files allowed
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {Array<string>} options.allowedTypes - Array of allowed MIME types
 * @returns {Function} - Express middleware function
 */
const validateFileUpload = (options = {}) => {
  const {
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  } = options;

  return (req, res, next) => {
    // Check if files exist
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    // Get files array
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    // Check number of files
    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${maxFiles} files allowed.`
      });
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
          file: file.originalname
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type.',
          file: file.originalname,
          allowedTypes
        });
      }
    }

    next();
  };
};

module.exports = {
  validate,
  sanitizeData,
  validateFileUpload
};