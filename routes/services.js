const express = require('express');
const router = express.Router();

// Service pricing data
const services = {
    'wash-fold': {
        name: 'Wash & Fold',
        basePrice: 1.50,
        unit: 'lb',
        items: [
            { name: 'Regular Clothes (per lb)', price: 1.50 },
            { name: 'Bedding (per lb)', price: 1.75 },
            { name: 'Towels (per lb)', price: 1.50 }
        ]
    },
    'dry-clean': {
        name: 'Dry Cleaning',
        basePrice: 5.00,
        unit: 'item',
        items: [
            { name: 'Shirt', price: 5.00 },
            { name: 'Pants', price: 7.00 },
            { name: 'Suit (2-piece)', price: 15.00 },
            { name: 'Suit (3-piece)', price: 20.00 },
            { name: 'Dress', price: 12.00 },
            { name: 'Coat/Jacket', price: 12.00 },
            { name: 'Tie', price: 5.00 },
            { name: 'Sweater', price: 8.00 }
        ]
    },
    'comforter': {
        name: 'Comforters & Large Items',
        basePrice: 25.00,
        unit: 'item',
        items: [
            { name: 'Comforter (Twin)', price: 20.00 },
            { name: 'Comforter (Full/Queen)', price: 25.00 },
            { name: 'Comforter (King)', price: 30.00 },
            { name: 'Duvet Cover', price: 15.00 },
            { name: 'Blanket', price: 15.00 },
            { name: 'Curtains (per panel)', price: 12.00 }
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
