// Express app configuration
module.exports = {
  // Application settings
  app: {
    name: 'Dern Support',
    version: '1.0.0',
    description: 'Support ticket and knowledge base system',
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // File upload configuration
  fileUpload: {
    uploadDir: 'uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  },
  
  // Logging configuration
  logging: {
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    options: {
      skip: (req, res) => res.statusCode < 400
    }
  }
};