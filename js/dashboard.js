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

    // Helper to create detail section
    const createDetail = (iconClass, title, text) => {
        const div = document.createElement('div');
        div.className = 'order-detail';

        const icon = document.createElement('i');
        icon.className = iconClass;

        const content = document.createElement('div');
        content.className = 'order-detail-content';

        const h4 = document.createElement('h4');
        h4.textContent = title;

        const p = document.createElement('p');
        p.textContent = text;

        content.appendChild(h4);
        content.appendChild(p);

        div.appendChild(icon);
        div.appendChild(content);
        return div;
    };

    // Header
    const header = document.createElement('div');
    header.className = 'order-header';

    const idDiv = document.createElement('div');
    idDiv.className = 'order-id';
    idDiv.textContent = `Order #${order._id.slice(-8).toUpperCase()}`;

    const statusSpan = document.createElement('span');
    statusSpan.className = `order-status status-${order.status}`;
    statusSpan.textContent = order.status;

    header.appendChild(idDiv);
    header.appendChild(statusSpan);

    // Details
    const details = document.createElement('div');
    details.className = 'order-details';

    details.appendChild(createDetail('fa-solid fa-calendar', 'Date', date));
    details.appendChild(createDetail('fa-solid fa-tag', 'Service Type', formatServiceType(order.serviceType)));
    details.appendChild(createDetail('fa-solid fa-location-dot', 'Pickup Address', order.pickupAddress));

    // Items
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'order-items';

    const h4Items = document.createElement('h4');
    h4Items.textContent = 'Items:';

    const ul = document.createElement('ul');
    order.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} (x${item.quantity})`;
        ul.appendChild(li);
    });

    itemsDiv.appendChild(h4Items);
    itemsDiv.appendChild(ul);

    // Total
    const totalDiv = document.createElement('div');
    totalDiv.className = 'order-total';

    const h3Total = document.createElement('h3');
    h3Total.textContent = `₦${order.totalPrice.toLocaleString()}`;

    totalDiv.appendChild(h3Total);

    card.appendChild(header);
    card.appendChild(details);
    card.appendChild(itemsDiv);
    card.appendChild(totalDiv);

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
    document.getElementById('total-spent').textContent = `₦${totalSpent.toLocaleString()}`;
}
