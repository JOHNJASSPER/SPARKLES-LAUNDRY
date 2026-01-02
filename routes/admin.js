const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const Order = require('../models/Order');
const User = require('../models/User');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin Only
router.get('/stats', adminAuth, async (req, res) => {
    try {
        // Get all orders
        const orders = await Order.find();

        // Calculate stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => o.status === 'processing').length;
        const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        // Paid orders (for when payment is integrated)
        const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
        const pendingPayments = orders.filter(o => o.paymentStatus === 'pending').length;

        // Get user count
        const totalUsers = await User.countDocuments();

        res.json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                processingOrders,
                completedOrders,
                totalRevenue,
                paidOrders,
                pendingPayments,
                totalUsers
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// @route   GET /api/admin/orders
// @desc    Get all orders from all users
// @access  Admin Only
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
});

// @route   GET /api/admin/orders/:id
// @desc    Get specific order details
// @access  Admin Only
router.get('/orders/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Admin order detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order'
        });
    }
});

// @route   PATCH /api/admin/orders/:id/status
// @desc    Update order status
// @access  Admin Only
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'completed', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid options: ' + validStatuses.join(', ')
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        order.updatedAt = Date.now();
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        console.error('Admin update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all registered users
// @access  Admin Only
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

module.exports = router;
