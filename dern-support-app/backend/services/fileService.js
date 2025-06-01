const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const logger = require('../utils/logger');
const appConfig = require('../config/app');

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * File service for handling file uploads and management
 * @module services/fileService
 */

/**
 * Save a file to the uploads directory
 * @param {Object} file - File object from multer
 * @param {string} subdirectory - Subdirectory within uploads
 * @returns {Promise<Object>} - Saved file metadata
 */
exports.saveFile = async (file, subdirectory = '') => {
  try {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', subdirectory);
    await mkdir(uploadDir, { recursive: true });
    
    // Generate a unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Write the file
    await writeFile(filePath, file.buffer);
    
    // Return file metadata
    return {
      filename: uniqueFilename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: path.join(subdirectory, uniqueFilename).replace(/\\/g, '/'),
      uploadedAt: new Date()
    };
  } catch (error) {
    logger.error(`Error saving file: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a file from the uploads directory
 * @param {string} filePath - Path to the file relative to uploads directory
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', 'uploads', filePath);
    await unlink(fullPath);
    return true;
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    throw error;
  }
};

/**
 * Get file metadata
 * @param {string} filePath - Path to the file relative to uploads directory
 * @returns {Promise<Object>} - File metadata
 */
exports.getFileMetadata = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', 'uploads', filePath);
    const stats = await stat(fullPath);
    
    return {
      filename: path.basename(filePath),
      path: filePath,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    logger.error(`Error getting file metadata: ${error.message}`);
    throw error;
  }
};

/**
 * List files in a subdirectory
 * @param {string} subdirectory - Subdirectory within uploads
 * @returns {Promise<Array>} - Array of file metadata
 */
exports.listFiles = async (subdirectory = '') => {
  try {
    const dirPath = path.join(__dirname, '..', 'uploads', subdirectory);
    
    // Create directory if it doesn't exist
    await mkdir(dirPath, { recursive: true });
    
    const files = await readdir(dirPath);
    const fileMetadata = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(subdirectory, file);
        return await exports.getFileMetadata(filePath);
      })
    );
    
    return fileMetadata;
  } catch (error) {
    logger.error(`Error listing files: ${error.message}`);
    throw error;
  }
};

/**
 * Validate file type
 * @param {string} mimetype - File MIME type
 * @returns {boolean} - Whether the file type is allowed
 */
exports.isValidFileType = (mimetype) => {
  return appConfig.fileUpload.allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {boolean} - Whether the file size is allowed
 */
exports.isValidFileSize = (size) => {
  return size <= appConfig.fileUpload.maxFileSize;
};

/**
 * Process multiple file uploads
 * @param {Array} files - Array of file objects from multer
 * @param {string} subdirectory - Subdirectory within uploads
 * @returns {Promise<Array>} - Array of saved file metadata
 */
exports.processMultipleFiles = async (files, subdirectory = '') => {
  try {
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        // Validate file type and size
        if (!exports.isValidFileType(file.mimetype)) {
          throw new Error(`Invalid file type: ${file.mimetype}`);
        }
        
        if (!exports.isValidFileSize(file.size)) {
          throw new Error(`File too large: ${file.size} bytes`);
        }
        
        return await exports.saveFile(file, subdirectory);
      })
    );
    
    return savedFiles;
  } catch (error) {
    logger.error(`Error processing multiple files: ${error.message}`);
    throw error;
  }
};

/**
 * Get the full URL for a file
 * @param {string} filePath - Path to the file relative to uploads directory
 * @returns {string} - Full URL to the file
 */
exports.getFileUrl = (filePath) => {
  const baseUrl = appConfig.app.baseUrl || 'http://localhost:5000';
  return `${baseUrl}/${filePath}`;
};

/**
 * Create a temporary download link for a file
 * @param {string} filePath - Path to the file relative to uploads directory
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Object} - Download link info
 */
exports.createTemporaryDownloadLink = (filePath, expiresIn = 3600) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (expiresIn * 1000);
  
  // In a real application, this would be stored in a database or cache
  // For this implementation, we'll just return the token and expiration
  
  return {
    token,
    expires,
    url: `${appConfig.app.baseUrl || 'http://localhost:5000'}/api/files/download/${token}`,
    filePath
  };
};