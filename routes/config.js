const express = require('express');
const router = express.Router();

// @route   GET /api/config
// @desc    Get public configuration (public keys, feature flags)
// @access  Public
router.get('/', (req, res) => {
    res.json({
        success: true,
        paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
        firebaseConfig: {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        }
    });
});

module.exports = router;
