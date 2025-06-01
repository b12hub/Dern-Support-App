// Authentication configuration
module.exports = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expire: process.env.JWT_EXPIRE || '7d',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    }
  },
  
  // Password reset configuration
  passwordReset: {
    tokenExpire: 10 * 60 * 1000, // 10 minutes
    emailFrom: process.env.EMAIL_FROM || 'noreply@dern-support.com'
  },
  
  // Email verification configuration
  emailVerification: {
    tokenExpire: 24 * 60 * 60 * 1000, // 24 hours
    emailFrom: process.env.EMAIL_FROM || 'noreply@dern-support.com'
  },
  
  // Role-based access control
  roles: {
    admin: ['admin'],
    technician: ['admin', 'technician'],
    business: ['admin', 'technician', 'business'],
    individual: ['admin', 'technician', 'business', 'individual']
  }
};