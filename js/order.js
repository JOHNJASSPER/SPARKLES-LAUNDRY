// Last deployed: 2026-01-02 - Multi-currency Payment Support
// Order page functionality
let selectedService = null;
let selectedItems = [];
let servicesData = null;
let exchangeRate = 1450; // Default fallback
let selectedPaymentMethod = 'paystack';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authHelpers.requireAuth()) {
        return;
    }

    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        authHelpers.logout();
    });

    // Load services data
    await loadServices();

    // Load exchange rate
    await loadExchangeRate();

    // Setup service selection
    setupServiceSelection();

    // Setup payment selection
    setupPaymentSelection();

    // Setup submit button
    document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
});

// Load services and pricing from API
async function loadServices() {
    try {
        const response = await api.services.getAll();
        servicesData = response.services;
    } catch (error) {
        console.error('Error loading services:', error);
        alert('Error loading services. Please refresh the page.');
    }
}

// Load exchange rate
async function loadExchangeRate() {
    try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        if (data.success) {
            exchangeRate = data.rate;
        }
    } catch (error) {
        console.error('Error loading exchange rate:', error);
    }
}

// Setup service selection handlers
function setupServiceSelection() {
    const serviceOptions = document.querySelectorAll('.service-option');

    serviceOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove previous selection
            serviceOptions.forEach(opt => opt.classList.remove('selected'));

            // Select this service
            option.classList.add('selected');
            selectedService = option.dataset.service;

            // Reset items
            selectedItems = [];

            // Load items for this service
            loadServiceItems(selectedService);

            // Show items section
            document.getElementById('items-section').style.display = 'block';
            document.getElementById('address-section').style.display = 'block';

            // Update summary
            updateOrderSummary();
        });
    });
}

// Setup payment method selection
function setupPaymentSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const radioButtons = document.getElementsByName('payment-method');

    // Handle clicks on the option div
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Update UI
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Select radio button
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;
            selectedPaymentMethod = radio.value;
        });
    });

    // Handle direct radio button changes
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedPaymentMethod = e.target.value;
                // Update UI to match
                paymentOptions.forEach(opt => {
                    if (opt.querySelector('input').value === selectedPaymentMethod) {
                        opt.classList.add('selected');
                    } else {
                        opt.classList.remove('selected');
                    }
                });
            }
        });
    });
}

// Load items for selected service
function loadServiceItems(serviceType) {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';

    if (!servicesData || !servicesData[serviceType]) {
        return;
    }

    const service = servicesData[serviceType];

    service.items.forEach(item => {
        const itemCard = createItemCard(item);
        itemsList.appendChild(itemCard);
    });
}

// Create item card element
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';

    // Safe DOM creation
    const itemHeader = document.createElement('div');
    itemHeader.className = 'item-header';

    const h4 = document.createElement('h4');
    h4.textContent = item.name;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'item-price';
    priceSpan.textContent = `₦${item.price.toLocaleString()}`;

    itemHeader.appendChild(h4);
    itemHeader.appendChild(priceSpan);

    const itemQuantity = document.createElement('div');
    itemQuantity.className = 'item-quantity';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'qty-btn minus';
    minusBtn.dataset.item = item.name;
    minusBtn.dataset.price = item.price;
    minusBtn.innerHTML = '<i class="fa-solid fa-minus"></i>'; // Safe: static HTML

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'qty-input';
    qtyInput.value = '0';
    qtyInput.min = '0';
    qtyInput.readOnly = true;
    qtyInput.dataset.item = item.name;
    qtyInput.dataset.price = item.price;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'qty-btn plus';
    plusBtn.dataset.item = item.name;
    plusBtn.dataset.price = item.price;
    plusBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'; // Safe: static HTML

    itemQuantity.appendChild(minusBtn);
    itemQuantity.appendChild(qtyInput);
    itemQuantity.appendChild(plusBtn);

    card.appendChild(itemHeader);
    card.appendChild(itemQuantity);

    // Add event listeners directly to the created buttons
    minusBtn.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value, 10);
        if (qty > 0) {
            qty--;
            qtyInput.value = qty;
            updateItemQuantity(item.name, item.price, qty);
        }
    });

    plusBtn.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value, 10);
        qty++;
        qtyInput.value = qty;
        updateItemQuantity(item.name, item.price, qty);
    });

    return card;
}

// Update item quantity in selected items
function updateItemQuantity(itemName, itemPrice, quantity) {
    // Find existing item
    const existingIndex = selectedItems.findIndex(item => item.name === itemName);

    if (quantity === 0) {
        // Remove item if quantity is 0
        if (existingIndex !== -1) {
            selectedItems.splice(existingIndex, 1);
        }
    } else {
        // Update or add item
        if (existingIndex !== -1) {
            selectedItems[existingIndex].quantity = quantity;
        } else {
            selectedItems.push({
                name: itemName,
                price: itemPrice,
                quantity: quantity
            });
        }
    }

    updateOrderSummary();
}

// Update order summary display
function updateOrderSummary() {
    const summaryItems = document.getElementById('summary-items');
    const totalPrice = document.getElementById('total-price');
    const submitBtn = document.getElementById('submit-order-btn');

    if (selectedItems.length === 0) {
        summaryItems.innerHTML = '<p class="empty-summary">No items selected yet</p>';
        totalPrice.textContent = '₦0';
        submitBtn.disabled = true;
        return;
    }

    // Calculate total
    let total = 0;

    summaryItems.innerHTML = '';

    selectedItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'summary-item-name';
        nameSpan.textContent = item.name;

        const qtySpan = document.createElement('span');
        qtySpan.className = 'summary-item-qty';
        qtySpan.textContent = `x${item.quantity}`;

        const priceSpan = document.createElement('span');
        priceSpan.className = 'summary-item-price';
        priceSpan.textContent = `₦${itemTotal.toLocaleString()}`;

        summaryItem.appendChild(nameSpan);
        summaryItem.appendChild(qtySpan);
        summaryItem.appendChild(priceSpan);

        summaryItems.appendChild(summaryItem);
    });

    totalPrice.textContent = `₦${total.toLocaleString()}`;

    // Update USDT estimate
    const usdtAmount = total / exchangeRate;
    const usdtDisplay = document.getElementById('usdt-amount-display');
    if (usdtDisplay) {
        usdtDisplay.textContent = `~${usdtAmount.toFixed(2)} USDT`;
    }

    submitBtn.disabled = false;
}

// Submit order
async function submitOrder() {
    const pickupAddress = document.getElementById('pickup-address').value.trim();
    let deliveryAddress = document.getElementById('delivery-address').value.trim();
    const specialInstructions = document.getElementById('special-instructions').value.trim();

    // Validation
    if (!selectedService) {
        alert('Please select a service type');
        return;
    }

    if (selectedItems.length === 0) {
        alert('Please select at least one item');
        return;
    }

    if (!pickupAddress) {
        alert('Please enter a pickup address');
        return;
    }

    // Use pickup address as delivery if not specified
    if (!deliveryAddress) {
        deliveryAddress = pickupAddress;
    }

    // Calculate total
    const totalPrice = selectedItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
    );

    // Check for minimum USDT amount if USDT is selected
    // Note: exchangeRate is already loaded globally via loadExchangeRate()
    const usdtAmount = totalPrice / exchangeRate;

    if (selectedPaymentMethod === 'usdt' && usdtAmount < 5) {
        alert(`Minimum order for USDT payment is $5.00 equivalent (approx ₦${(5 * exchangeRate).toLocaleString()}). Current order is ~$${usdtAmount.toFixed(2)}.`);
        return;
    }

    // Prepare order data
    const orderData = {
        serviceType: selectedService,
        items: selectedItems,
        totalPrice: totalPrice,
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddress,
        specialInstructions: specialInstructions
    };

    // Disable submit button
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';

    try {
        const response = await api.orders.create(orderData);

        if (response.success) {
            if (selectedPaymentMethod === 'paystack') {
                // Initialize Paystack payment
                initializePayment(response.order);
            } else {
                // Initialize Binance Pay (USDT)
                initializeBinancePayment(response.order);
            }
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Error placing order: ' + (error.message || 'Please try again'));

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Place Order';
    }
}

// Initialize Binance Pay payment
async function initializeBinancePayment(order) {
    const submitBtn = document.getElementById('submit-order-btn');

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId: order._id })
        });

        const data = await response.json();

        if (data.success) {
            if (data.paymentData && data.paymentData.checkoutUrl) {
                // Redirect to Binance Pay
                window.location.href = data.paymentData.checkoutUrl;
            } else if (data.demoMode) {
                // Handle Testnet/Manual Mode
                const walletAddress = data.paymentData.walletAddress;
                const amount = data.paymentData.amount;
                const currency = data.paymentData.currency;

                // Create a simple modal for manual transfer instructions
                const modalOverlay = document.createElement('div');
                modalOverlay.id = 'manual-payment-modal';
                Object.assign(modalOverlay.style, {
                    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: '1000'
                });

                const modalContent = document.createElement('div');
                Object.assign(modalContent.style, {
                    background: 'white', padding: '30px', borderRadius: '15px',
                    maxWidth: '500px', width: '90%', textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                });

                const h3 = document.createElement('h3');
                Object.assign(h3.style, { color: '#023e8a', marginBottom: '15px' });
                h3.innerHTML = '<i class="fa-brands fa-bitcoin"></i> USDT Manual Transfer (Testnet)'; // Icon is safe

                const pDesc = document.createElement('p');
                Object.assign(pDesc.style, { marginBottom: '20px', color: '#666' });
                pDesc.textContent = 'Binance Pay is in test mode. Please send the exact amount to the wallet below.';

                const amountDiv = document.createElement('div');
                Object.assign(amountDiv.style, {
                    background: '#f8f9fa', padding: '15px', borderRadius: '8px',
                    marginBottom: '20px', border: '1px solid #dee2e6'
                });

                const pAmountLabel = document.createElement('p');
                Object.assign(pAmountLabel.style, { fontSize: '0.9rem', color: '#888', marginBottom: '5px' });
                pAmountLabel.textContent = 'Amount:';

                const h2Amount = document.createElement('h2');
                Object.assign(h2Amount.style, { color: '#023e8a', margin: '0' });
                h2Amount.textContent = `${amount.toFixed(2)} ${currency}`;

                amountDiv.append(pAmountLabel, h2Amount);

                const walletDiv = document.createElement('div');
                Object.assign(walletDiv.style, {
                    background: '#f8f9fa', padding: '15px', borderRadius: '8px',
                    marginBottom: '25px', border: '1px solid #dee2e6', wordBreak: 'break-all'
                });

                const pWalletLabel = document.createElement('p');
                Object.assign(pWalletLabel.style, { fontSize: '0.9rem', color: '#888', marginBottom: '5px' });
                pWalletLabel.textContent = 'TRC20 Wallet Address:';

                const pWallet = document.createElement('p');
                Object.assign(pWallet.style, {
                    fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold',
                    margin: '0', userSelect: 'all'
                });
                pWallet.textContent = walletAddress; // Safe injection

                walletDiv.append(pWalletLabel, pWallet);

                const confirmBtn = document.createElement('button');
                Object.assign(confirmBtn.style, {
                    background: '#00b4d8', color: 'white', border: 'none',
                    padding: '12px 25px', borderRadius: '8px', fontSize: '1rem',
                    cursor: 'pointer', width: '100%'
                });
                confirmBtn.textContent = 'I Have Sent the Payment';
                confirmBtn.onclick = () => window.location.href = '/dashboard';

                modalContent.append(h3, pDesc, amountDiv, walletDiv, confirmBtn);
                modalOverlay.appendChild(modalContent);
                document.body.appendChild(modalOverlay);
            } else {
                throw new Error('Invalid payment response');
            }
        } else {
            throw new Error(data.message || 'Payment creation failed');
        }

    } catch (error) {
        console.error('Binance Pay initialization error:', error);
        alert('Error initializing USDT payment: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Place Order';
    }
}

// Initialize Paystack payment
async function initializePayment(order) {
    const submitBtn = document.getElementById('submit-order-btn');

    try {
        // Get Paystack public key from backend
        const configResponse = await api.config.get();
        if (!configResponse.success || !configResponse.paystackPublicKey) {
            throw new Error('Failed to load payment configuration');
        }
        const PAYSTACK_PUBLIC_KEY = configResponse.paystackPublicKey;

        // Initialize payment with backend
        const token = localStorage.getItem('token');
        const response = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId: order._id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Payment initialization failed');
        }

        // Trigger Paystack popup
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: authHelpers.getUser().email,
            amount: Math.round(order.totalPrice * 100), // Amount in kobo
            ref: data.reference,
            currency: 'NGN', // Explicitly set currency
            callback: function (response) {
                // Payment successful
                verifyPayment(response.reference);
            },
            onClose: function () {
                // User closed payment popup
                alert('Payment cancelled. You can complete payment from your dashboard.');
                window.location.href = '/dashboard';
            }
        });

        handler.openIframe();

    } catch (error) {
        console.error('Payment initialization error:', error);
        alert('Error initializing payment: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Place Order';
    }
}

// Verify payment
async function verifyPayment(reference) {
    const submitBtn = document.getElementById('submit-order-btn');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/paystack/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            alert('Payment successful! Your order has been placed.');
            window.location.href = '/dashboard';
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        alert('Payment verification failed. Please contact support if you were charged.');
        window.location.href = '/dashboard';
    }
}
