const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');

// Binance Pay Configuration
const BINANCE_PAY_API_KEY = process.env.BINANCE_PAY_API_KEY || '';
const BINANCE_PAY_SECRET = process.env.BINANCE_PAY_SECRET || '';
const BINANCE_MERCHANT_ID = process.env.BINANCE_MERCHANT_ID || '';
const BINANCE_PAY_BASE_URL = 'https://bpay.binanceapi.com';

// Generate Binance Pay signature
function generateSignature(timestamp, nonce, body) {
    const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
    return crypto
        .createHmac('sha512', BINANCE_PAY_SECRET)
        .update(payload)
        .digest('hex')
        .toUpperCase();
}

// Generate cryptographically secure random nonce
function generateNonce(length = 32) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// @route   POST /api/payments/create
// @desc    Create a Binance Pay order
// @access  Private
const ExchangeRate = require('../models/ExchangeRate');

// ... (existing imports)

// @route   POST /api/payments/create
// @desc    Create a Binance Pay order
// @access  Private
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Find the order
        const order = await Order.findOne({ _id: orderId, userId: req.userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if already paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // Get current exchange rate to calculate USDT amount
        const exchangeRateDoc = await ExchangeRate.getRate();
        const usdtRate = exchangeRateDoc.usdtToNgn;
        const usdtAmount = order.totalPrice / usdtRate;

        // Enforce Minimum Payment Amount ($5 USDT)
        if (usdtAmount < 5) {
            return res.status(400).json({
                success: false,
                message: `Minimum USDT payment is 5.00 USDT. Your order is ~${usdtAmount.toFixed(2)} USDT.`
            });
        }

        // check for Binance Pay Keys
        if (!BINANCE_PAY_API_KEY || !BINANCE_PAY_SECRET) {
            // Testnet / Manual Payment Mode
            // Return a manual TRC20 wallet address for testing/manual verification
            return res.json({
                success: true,
                message: 'Testnet Mode - Manual Transfer',
                demoMode: true, // Flag for frontend to show manual instructions
                paymentData: {
                    orderId: order._id,
                    amount: usdtAmount, // Send converted USDT amount
                    currency: 'USDT',
                    paymentId: 'MANUAL_' + Date.now(),
                    walletAddress: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW7', // Testnet/Dev wallet
                    network: 'TRC20',
                    qrCodeUrl: null
                }
            });
        }

        // Create Binance Pay order
        const timestamp = Date.now();
        const nonce = generateNonce();
        const merchantTradeNo = `SPARKLES_${order._id}_${timestamp}`;

        const requestBody = {
            env: {
                terminalType: 'WEB'
            },
            merchantTradeNo: merchantTradeNo,
            orderAmount: order.totalPrice.toFixed(2),
            currency: 'USDT',
            goods: {
                goodsType: '02', // Virtual goods
                goodsCategory: 'Z000',
                referenceGoodsId: order._id.toString(),
                goodsName: `Sparkles Laundry Order #${order._id.toString().slice(-8)}`,
                goodsDetail: `Laundry service - ${order.serviceType}`
            },
            returnUrl: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`,
            cancelUrl: `${process.env.APP_URL || 'http://localhost:3000'}/checkout?orderId=${order._id}`,
            webhookUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/payments/webhook`
        };

        const signature = generateSignature(timestamp, nonce, requestBody);

        const response = await fetch(`${BINANCE_PAY_BASE_URL}/binancepay/openapi/v2/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'BinancePay-Timestamp': timestamp.toString(),
                'BinancePay-Nonce': nonce,
                'BinancePay-Certificate-SN': BINANCE_PAY_API_KEY,
                'BinancePay-Signature': signature
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.status === 'SUCCESS') {
            // Update order with payment info
            order.paymentId = data.data.prepayId;
            order.paymentMethod = 'binance_pay';
            await order.save();

            res.json({
                success: true,
                paymentData: {
                    orderId: order._id,
                    amount: order.totalPrice,
                    currency: 'USDT',
                    checkoutUrl: data.data.checkoutUrl,
                    qrCodeUrl: data.data.qrcodeLink,
                    prepayId: data.data.prepayId,
                    expireTime: data.data.expireTime
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to create payment',
                error: data.errorMessage || 'Unknown error'
            });
        }

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Create payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating payment'
        });
    }
});

// @route   POST /api/payments/webhook
// @desc    Handle Binance Pay webhook notification
// @access  Public (verified by signature)
router.post('/webhook', async (req, res) => {
    try {
        // Verify webhook signature if Binance Pay is configured
        if (BINANCE_PAY_SECRET) {
            const receivedSignature = req.headers['binancepay-signature'];
            const timestamp = req.headers['binancepay-timestamp'];
            const nonce = req.headers['binancepay-nonce'];

            if (!receivedSignature || !timestamp || !nonce) {
                console.warn('Webhook received without required headers');
                return res.status(401).json({ returnCode: 'FAIL', returnMessage: 'Missing signature headers' });
            }

            // Verify the signature
            const expectedSignature = generateSignature(timestamp, nonce, req.body);
            if (receivedSignature !== expectedSignature) {
                console.warn('Webhook signature mismatch');
                return res.status(401).json({ returnCode: 'FAIL', returnMessage: 'Invalid signature' });
            }
        }

        const { bizType, data } = req.body;

        if (bizType === 'PAY') {
            const { merchantTradeNo, orderAmount } = data;

            // Extract order ID from merchantTradeNo
            const parts = merchantTradeNo.split('_');
            const orderId = parts[1];

            const order = await Order.findById(orderId);

            if (order) {
                order.paymentStatus = 'paid';
                order.paidAmount = parseFloat(orderAmount);
                order.paidCurrency = 'USDT';
                order.updatedAt = Date.now();
                await order.save();

                // Payment confirmed - logged only in development
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`Payment confirmed for order ${orderId}`);
                }
            }
        }

        res.json({ returnCode: 'SUCCESS', returnMessage: null });
    } catch (error) {
        console.error('Webhook error:', error.message); // Don't log full error to prevent info disclosure
        res.json({ returnCode: 'FAIL', returnMessage: 'Processing error' });
    }
});

// @route   GET /api/payments/status/:orderId
// @desc    Check payment status
// @access  Private
router.get('/status/:orderId', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
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
            paymentStatus: order.paymentStatus,
            paidAmount: order.paidAmount,
            paidCurrency: order.paidCurrency
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});

// @route   POST /api/payments/simulate-payment
// @desc    Simulate payment for demo mode (testing only)
// @access  Private
router.post('/simulate-payment', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findOne({ _id: orderId, userId: req.userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Simulate successful payment
        order.paymentStatus = 'paid';
        order.paidAmount = order.totalPrice;
        order.paidCurrency = 'USDT';
        order.paymentMethod = 'crypto';
        order.updatedAt = Date.now();
        await order.save();

        res.json({
            success: true,
            message: 'Payment simulated successfully',
            order
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Simulate payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error simulating payment'
        });
    }
});

module.exports = router;
