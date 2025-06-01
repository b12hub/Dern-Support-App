module.exports = {
    errorHandler: (err, req, res, next) => {
        console.error(err.stack);

        // Check for specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation Error',
                errors: Object.values(err.errors).map(e => e.message)
            });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid ID format'
            });
        }

        if (err.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate key error',
                field: Object.keys(err.keyValue)[0]
            });
        }

        // Default error response
        res.status(500).json({
            message: 'Server Error',
            error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
        });
    }
};
