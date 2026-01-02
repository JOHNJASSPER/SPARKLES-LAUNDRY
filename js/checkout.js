// Checkout page functionality
let orderId = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authHelpers.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('orderId');

    if (!orderId) {
        showError('No order ID provided');
        return;
    }

    // Initialize payment
    await initializePayment();

    // Setup copy button
    document.getElementById('copy-btn').addEventListener('click', copyWalletAddress);

    // Setup simulate payment button (demo mode)
    document.getElementById('simulate-payment-btn')?.addEventListener('click', simulatePayment);
});

// Initialize payment
async function initializePayment() {
    const loadingEl = document.getElementById('loading-state');
    const paymentContent = document.getElementById('payment-content');
    const errorState = document.getElementById('error-state');

    try {
        // Create payment request
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ orderId })
        });

        const data = await response.json();

        loadingEl.style.display = 'none';

        if (!response.ok) {
            showError(data.message || 'Failed to create payment');
            return;
        }

        // Display payment details
        displayPaymentDetails(data);
        paymentContent.style.display = 'block';

        // Start polling for payment status
        startPaymentStatusPolling();

    } catch (error) {
        console.error('Payment initialization error:', error);
        showError('Failed to initialize payment. Please try again.');
    }
}

// Display payment details
function displayPaymentDetails(data) {
    const paymentData = data.paymentData;

    // Order details
    document.getElementById('order-id').textContent = '#' + paymentData.orderId.slice(-8).toUpperCase();
    document.getElementById('order-total').textContent = '$' + paymentData.amount.toFixed(2);

    // Crypto amount
    document.getElementById('crypto-amount').textContent = paymentData.amount.toFixed(2) + ' USDT';

    // Wallet address
    document.getElementById('wallet-address').value = paymentData.walletAddress || 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW7';

    // Check if demo mode
    if (data.demoMode) {
        document.getElementById('demo-notice').style.display = 'block';
    }

    // If there's a checkout URL (Binance Pay configured), could redirect or display
    if (paymentData.checkoutUrl) {
        // Could add button to redirect to Binance Pay hosted checkout
    }
}

// Copy wallet address
function copyWalletAddress() {
    const addressInput = document.getElementById('wallet-address');
    addressInput.select();
    document.execCommand('copy');

    const copyBtn = document.getElementById('copy-btn');
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

    setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
    }, 2000);
}

// Start polling for payment status
function startPaymentStatusPolling() {
    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/payments/status/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success && data.paymentStatus === 'paid') {
                clearInterval(pollingInterval);
                showSuccess();
            }
        } catch (error) {
            console.error('Status polling error:', error);
        }
    }, 5000); // Poll every 5 seconds
}

// Simulate payment (demo mode only)
async function simulatePayment() {
    const btn = document.getElementById('simulate-payment-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        const response = await fetch('/api/payments/simulate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ orderId })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess();
        } else {
            alert('Error: ' + data.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Simulate Payment';
        }
    } catch (error) {
        console.error('Simulate payment error:', error);
        alert('Error simulating payment');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Simulate Payment';
    }
}

// Show error state
function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('payment-content').style.display = 'none';
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').style.display = 'block';
}

// Show success state
function showSuccess() {
    clearInterval(pollingInterval);
    document.getElementById('payment-content').style.display = 'none';
    document.getElementById('success-state').style.display = 'block';
}

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
