const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const https = require('https');

// Initialize payment
router.post('/initialize', protect, async (req, res) => {
    try {
        const { orderId } = req.body;

        // Get user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order
        if (order.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Convert amount to kobo (Paystack uses kobo, not naira)
        const amountInKobo = Math.round(order.totalPrice * 100);

        // Prepare Paystack payment initialization
        const params = JSON.stringify({
            email: user.email,
            amount: amountInKobo,
            reference: `ORDER_${order._id}_${Date.now()}`,
            metadata: {
                orderId: order._id.toString(),
                customerName: user.name
            },
            callback_url: `${process.env.APP_URL || 'https://sparkles-laundry.onrender.com'}/dashboard`
        });

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params)
            }
        };

        // Make request to Paystack
        const paystackReq = https.request(options, (paystackRes) => {
            let data = '';

            paystackRes.on('data', (chunk) => {
                data += chunk;
            });

            paystackRes.on('end', () => {
                const response = JSON.parse(data);

                if (response.status) {
                    // Update order with payment reference
                    order.paymentReference = response.data.reference;
                    order.save();

                    res.json({
                        success: true,
                        authorization_url: response.data.authorization_url,
                        access_code: response.data.access_code,
                        reference: response.data.reference
                    });
                } else {
                    res.status(400).json({
                        message: 'Failed to initialize payment',
                        error: response.message
                    });
                }
            });
        });

        paystackReq.on('error', (error) => {
            console.error('Paystack error:', error);
            res.status(500).json({ message: 'Payment initialization failed' });
        });

        paystackReq.write(params);
        paystackReq.end();

    } catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify payment
router.get('/verify/:reference', protect, async (req, res) => {
    try {
        const { reference } = req.params;

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${reference}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        };

        const paystackReq = https.request(options, (paystackRes) => {
            let data = '';

            paystackRes.on('data', (chunk) => {
                data += chunk;
            });

            paystackRes.on('end', async () => {
                const response = JSON.parse(data);

                if (response.status && response.data.status === 'success') {
                    // Find order by reference
                    const order = await Order.findOne({ paymentReference: reference });

                    if (order) {
                        // Update order status
                        order.paymentStatus = 'paid';
                        order.status = 'processing';
                        await order.save();

                        res.json({
                            success: true,
                            message: 'Payment verified successfully',
                            order
                        });
                    } else {
                        res.status(404).json({ message: 'Order not found' });
                    }
                } else {
                    res.status(400).json({
                        success: false,
                        message: 'Payment verification failed'
                    });
                }
            });
        });

        paystackReq.on('error', (error) => {
            console.error('Verification error:', error);
            res.status(500).json({ message: 'Verification failed' });
        });

        paystackReq.end();

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
