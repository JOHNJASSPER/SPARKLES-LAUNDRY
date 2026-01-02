const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/exchange-rate
// @desc    Get current exchange rate
// @access  Public
router.get('/', async (req, res) => {
    try {
        const rate = await ExchangeRate.getRate();
        res.json({
            success: true,
            rate: rate.usdtToNgn,
            lastUpdated: rate.lastUpdated
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Get exchange rate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching exchange rate'
        });
    }
});

// @route   PUT /api/exchange-rate
// @desc    Update exchange rate (Admin only)
// @access  Private (Admin)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { rate } = req.body;

        if (!rate || rate <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid rate is required'
            });
        }

        const updatedRate = await ExchangeRate.updateRate(rate, req.userId);

        res.json({
            success: true,
            message: 'Exchange rate updated successfully',
            rate: updatedRate.usdtToNgn,
            lastUpdated: updatedRate.lastUpdated
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Update exchange rate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating exchange rate'
        });
    }
});

// @route   GET /api/exchange-rate/convert/:amount
// @desc    Convert NGN amount to USDT
// @access  Public
router.get('/convert/:amount', async (req, res) => {
    try {
        const { amount } = req.params;
        const ngnAmount = parseFloat(amount);

        if (isNaN(ngnAmount) || ngnAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        const rate = await ExchangeRate.getRate();
        const usdtAmount = ngnAmount / rate.usdtToNgn;

        res.json({
            success: true,
            ngn: ngnAmount,
            usdt: parseFloat(usdtAmount.toFixed(2)),
            rate: rate.usdtToNgn
        });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Convert amount error:', error);
        res.status(500).json({
            success: false,
            message: 'Error converting amount'
        });
    }
});

module.exports = router;
