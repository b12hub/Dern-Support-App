import jwt from "jsonwebtoken";

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        let decoded;
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Add user info to request
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
