const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists - use generic message to prevent enumeration
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'Registration failed. Please try again or use a different email.'
            });
        }

        // Hash password with 12 rounds (increased from 10 for better security)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            authProvider: 'local'
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user registered with Google - use same generic message
        if (user.authProvider === 'google') {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', [
    body('idToken').notEmpty().withMessage('Google ID token is required')
], async (req, res) => {
    try {
        const { idToken } = req.body;

        // For now, we'll implement a simplified version
        // In production, you would verify the Google token with Firebase Admin SDK
        // This is a placeholder that expects decoded user data from the frontend
        const { email, name, googleId } = req.body;

        if (!email || !name || !googleId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required Google user data'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists, check if they used Google before
            if (user.authProvider === 'local') {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered with password. Please login with email and password.'
                });
            }
        } else {
            // Create new user
            user = new User({
                name,
                email,
                googleId,
                authProvider: 'google'
            });
            await user.save();
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Google authentication successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during Google authentication'
        });
    }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;
