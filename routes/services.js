const express = require('express');
const router = express.Router();

// Service pricing data (NGN - Nigerian Naira)
const services = {
    'wash-fold': {
        name: 'Wash & Fold',
        basePrice: 300,
        unit: 'item',
        items: [
            { name: 'Regular Clothes', price: 300 },
            { name: 'Bedding', price: 400 },
            { name: 'Towels', price: 250 }
        ]
    },
    'dry-clean': {
        name: 'Dry Cleaning',
        basePrice: 1000,
        unit: 'item',
        items: [
            { name: 'Shirt', price: 800 },
            { name: 'Pants', price: 1000 },
            { name: 'Suit (2-piece)', price: 2500 },
            { name: 'Suit (3-piece)', price: 3500 },
            { name: 'Dress', price: 1500 },
            { name: 'Coat/Jacket', price: 1800 },
            { name: 'Tie', price: 500 },
            { name: 'Sweater', price: 1200 }
        ]
    },
    'comforter': {
        name: 'Comforters & Large Items',
        basePrice: 3000,
        unit: 'item',
        items: [
            { name: 'Comforter (Twin)', price: 2500 },
            { name: 'Comforter (Full/Queen)', price: 3000 },
            { name: 'Comforter (King)', price: 3500 },
            { name: 'Duvet Cover', price: 2000 },
            { name: 'Blanket', price: 2000 },
            { name: 'Curtains (per panel)', price: 1500 }
        ]
    }
};

// @route   GET /api/services
// @desc    Get all services and pricing
// @access  Public
router.get('/', (req, res) => {
    res.json({
        success: true,
        services
    });
});

// @route   GET /api/services/:type
// @desc    Get specific service pricing
// @access  Public
router.get('/:type', (req, res) => {
    const { type } = req.params;

    if (!services[type]) {
        return res.status(404).json({
            success: false,
            message: 'Service type not found'
        });
    }

    res.json({
        success: true,
        service: services[type]
    });
});

// @route   POST /api/services/calculate
// @desc    Calculate total price for an order
// @access  Public
router.post('/calculate', (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        let totalPrice = 0;
        const calculatedItems = [];

        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            calculatedItems.push({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal
            });
        });

        res.json({
            success: true,
            items: calculatedItems,
            totalPrice: totalPrice.toFixed(2)
        });
    } catch (error) {
        console.error('Calculate price error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating price'
        });
    }
});

module.exports = router;
