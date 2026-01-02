const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authMiddleware, [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('serviceType').isIn(['wash-fold', 'dry-clean', 'comforter', 'mixed']).withMessage('Invalid service type'),
    body('pickupAddress').notEmpty().withMessage('Pickup address is required'),
    body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
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

        const { items, serviceType, pickupAddress, deliveryAddress, specialInstructions } = req.body;

        // Calculate total price
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create new order
        const order = new Order({
            userId: req.userId,
            items,
            serviceType,
            totalPrice,
            pickupAddress,
            deliveryAddress,
            specialInstructions: specialInstructions || ''
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating order'
        });
    }
});

// @route   GET /api/orders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get a specific order
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.userId
        });

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
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching order'
        });
    }
});

// @route   PATCH /api/orders/:id
// @desc    Update order status (for admin use, but accessible by user for now)
// @access  Private
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'processing', 'completed', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.userId
        });

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
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating order'
        });
    }
});

module.exports = router;
