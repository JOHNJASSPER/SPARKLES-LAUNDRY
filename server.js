// Load .env only in local development (file won't exist on Vercel)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// MongoDB Connection Strategy (Serverless & Local)
let isConnected = false; // Track connection status

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI);
        isConnected = db.connections[0].readyState;
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        lastError = err.message;
    }
};

let lastError = null;

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/services', require('./routes/services'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/paystack', require('./routes/paystack'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    const uriRaw = process.env.MONGODB_URI || '';
    const uriCheck = uriRaw.length > 20 ? uriRaw.substring(0, 25) + '...' : 'Invalid/Short';

    res.json({
        success: true,
        message: 'Server is running',
        mongodb: isConnected === 1 ? 'connected' : 'disconnected',
        error: lastError,
        uriCheck: uriCheck
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'order.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
// Start server
const PORT = process.env.PORT || 3000;

// Only listen if run directly (development), not if imported (Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📱 Frontend: http://localhost:${PORT}`);
        console.log(`🔌 API: http://localhost:${PORT}/api`);
    });
}

// Export for Vercel
module.exports = app;
