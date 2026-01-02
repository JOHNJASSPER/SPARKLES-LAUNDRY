const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin email - can access admin panel
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sparkles.com';

const adminAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Add user to request
        req.userId = decoded.userId;
        req.user = user;
        req.isAdmin = true;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = adminAuth;
