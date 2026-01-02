// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authHelpers.requireAuth()) {
        return;
    }

    // Get user data
    const user = authHelpers.getUser();
    if (user) {
        document.getElementById('user-name').textContent = user.name;
    }

    // Hide Dashboard button on dashboard page
    const dashboardNavItem = document.getElementById('dashboard-nav-item');
    if (dashboardNavItem) {
        dashboardNavItem.style.display = 'none';
    }

    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        authHelpers.logout();
    });

    // Load orders
    await loadOrders();
});

// Load and display orders
async function loadOrders() {
    const loadingEl = document.getElementById('loading-orders');
    const noOrdersEl = document.getElementById('no-orders');
    const ordersListEl = document.getElementById('orders-list');

    try {
        const response = await api.orders.getAll();

        loadingEl.style.display = 'none';

        if (!response.orders || response.orders.length === 0) {
            noOrdersEl.style.display = 'block';
            updateStats([], 0);
            return;
        }

        // Display orders
        noOrdersEl.style.display = 'none';
        ordersListEl.style.display = 'block';

        renderOrders(response.orders);
        updateStats(response.orders, response.count);

    } catch (error) {
        console.error('Error loading orders:', error);
        loadingEl.innerHTML = `
            <i class="fa-solid fa-exclamation-circle"></i>
            <p>Error loading orders. Please try again.</p>
        `;
    }
}

// Render orders to the page
function renderOrders(orders) {
    const ordersListEl = document.getElementById('orders-list');
    ordersListEl.innerHTML = '';

    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersListEl.appendChild(orderCard);
    });
}

// Create order card element
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const itemsList = order.items.map(item =>
        `<li>${item.name} (x${item.quantity})</li>`
    ).join('');

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
            <span class="order-status status-${order.status}">${order.status}</span>
        </div>
        
        <div class="order-details">
            <div class="order-detail">
                <i class="fa-solid fa-calendar"></i>
                <div class="order-detail-content">
                    <h4>Date</h4>
                    <p>${date}</p>
                </div>
            </div>
            <div class="order-detail">
                <i class="fa-solid fa-tag"></i>
                <div class="order-detail-content">
                    <h4>Service Type</h4>
                    <p>${formatServiceType(order.serviceType)}</p>
                </div>
            </div>
            <div class="order-detail">
                <i class="fa-solid fa-location-dot"></i>
                <div class="order-detail-content">
                    <h4>Pickup Address</h4>
                    <p>${order.pickupAddress}</p>
                </div>
            </div>
        </div>

        <div class="order-items">
            <h4>Items:</h4>
            <ul>${itemsList}</ul>
        </div>

        <div class="order-total">
            <h3>$${order.totalPrice.toFixed(2)}</h3>
        </div>
    `;

    return card;
}

// Format service type for display
function formatServiceType(type) {
    const types = {
        'wash-fold': 'Wash & Fold',
        'dry-clean': 'Dry Cleaning',
        'comforter': 'Comforter',
        'mixed': 'Mixed Services'
    };
    return types[type] || type;
}

// Update statistics
function updateStats(orders, totalCount) {
    // Total orders
    document.getElementById('total-orders').textContent = totalCount;

    // Pending orders
    const pendingCount = orders.filter(o =>
        o.status === 'pending' || o.status === 'processing'
    ).length;
    document.getElementById('pending-orders').textContent = pendingCount;

    // Completed orders
    const completedCount = orders.filter(o =>
        o.status === 'completed' || o.status === 'delivered'
    ).length;
    document.getElementById('completed-orders').textContent = completedCount;

    // Total spent
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
}
