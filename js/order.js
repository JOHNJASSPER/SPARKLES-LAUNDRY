// Last deployed: 2026-01-02 - Paystack Integration
// Order page functionality
let selectedService = null;
let selectedItems = [];
let servicesData = null;

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

    // Setup service selection
    setupServiceSelection();

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

    card.innerHTML = `
        <div class="item-header">
            <h4>${item.name}</h4>
            <span class="item-price">₦${item.price.toLocaleString()}</span>
        </div>
        <div class="item-quantity">
            <button class="qty-btn minus" data-item="${item.name}" data-price="${item.price}">
                <i class="fa-solid fa-minus"></i>
            </button>
            <input type="number" class="qty-input" value="0" min="0" readonly 
                data-item="${item.name}" data-price="${item.price}">
            <button class="qty-btn plus" data-item="${item.name}" data-price="${item.price}">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    `;

    // Setup quantity buttons
    const minusBtn = card.querySelector('.minus');
    const plusBtn = card.querySelector('.plus');
    const qtyInput = card.querySelector('.qty-input');

    minusBtn.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value);
        if (qty > 0) {
            qty--;
            qtyInput.value = qty;
            updateItemQuantity(item.name, item.price, qty);
        }
    });

    plusBtn.addEventListener('click', () => {
        let qty = parseInt(qtyInput.value);
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
    let summaryHTML = '';

    selectedItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        summaryHTML += `
            <div class="summary-item">
                <span class="summary-item-name">${item.name}</span>
                <span class="summary-item-qty">x${item.quantity}</span>
                <span class="summary-item-price">₦${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });

    summaryItems.innerHTML = summaryHTML;
    totalPrice.textContent = `₦${total.toLocaleString()}`;
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
            // Initialize Paystack payment
            initializePayment(response.order);
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Error placing order: ' + (error.message || 'Please try again'));

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Place Order';
    }
}

// Initialize Paystack payment
async function initializePayment(order) {
    const submitBtn = document.getElementById('submit-order-btn');

    try {
        // Get Paystack public key from environment (you'll need to add this)
        const PAYSTACK_PUBLIC_KEY = 'pk_test_e0fb17876fd0a75f5192f5cb643e68a98912364e';

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
