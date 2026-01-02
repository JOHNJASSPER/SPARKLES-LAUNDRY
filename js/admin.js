// Admin Dashboard functionality
let allOrders = [];
let currentOrderId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authHelpers.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        authHelpers.logout();
    });

    // Verify admin access
    const hasAccess = await verifyAdminAccess();

    if (!hasAccess) {
        document.getElementById('access-denied').style.display = 'block';
        return;
    }

    // Show admin content
    document.getElementById('admin-content').style.display = 'block';

    // Load data
    await loadStats();
    await loadOrders();

    // Setup filter
    document.getElementById('status-filter').addEventListener('change', filterOrders);

    // Setup modal
    document.getElementById('cancel-modal').addEventListener('click', closeModal);
    document.getElementById('confirm-status').addEventListener('click', updateOrderStatus);
});

// Verify admin access
async function verifyAdminAccess() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('total-orders').textContent = data.stats.totalOrders;
            document.getElementById('pending-orders').textContent = data.stats.pendingOrders;
            document.getElementById('total-revenue').textContent = '$' + data.stats.totalRevenue.toFixed(2);
            document.getElementById('total-users').textContent = data.stats.totalUsers;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load all orders
async function loadOrders() {
    const loadingEl = document.getElementById('loading-orders');
    const tableContainer = document.getElementById('orders-table-container');

    try {
        const response = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        loadingEl.style.display = 'none';

        if (data.success) {
            allOrders = data.orders;
            renderOrders(allOrders);
            tableContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingEl.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> Error loading orders';
    }
}

// Render orders to table
function renderOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No orders found</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const date = new Date(order.createdAt).toLocaleDateString();
        const customerName = order.userId?.name || 'Unknown';
        const customerEmail = order.userId?.email || 'N/A';

        // Order ID
        const tdId = document.createElement('td');
        tdId.className = 'order-id';
        tdId.textContent = '#' + order._id.slice(-8).toUpperCase();
        row.appendChild(tdId);

        // Customer Info
        const tdCustomer = document.createElement('td');
        const divInfo = document.createElement('div');
        divInfo.className = 'customer-info';

        const spanName = document.createElement('span');
        spanName.className = 'customer-name';
        spanName.textContent = customerName;

        const spanEmail = document.createElement('span');
        spanEmail.className = 'customer-email';
        spanEmail.textContent = customerEmail;

        divInfo.appendChild(spanName);
        divInfo.appendChild(spanEmail);
        tdCustomer.appendChild(divInfo);
        row.appendChild(tdCustomer);

        // Service Type
        const tdService = document.createElement('td');
        tdService.textContent = formatServiceType(order.serviceType);
        row.appendChild(tdService);

        // Price
        const tdPrice = document.createElement('td');
        const strongPrice = document.createElement('strong');
        strongPrice.textContent = '$' + order.totalPrice.toFixed(2);
        tdPrice.appendChild(strongPrice);
        row.appendChild(tdPrice);

        // Payment Status
        const tdPayment = document.createElement('td');
        const spanPayment = document.createElement('span');
        const pStatus = order.paymentStatus || 'pending';
        spanPayment.className = `payment-badge payment-${pStatus}`;
        spanPayment.textContent = pStatus;
        tdPayment.appendChild(spanPayment);
        row.appendChild(tdPayment);

        // Order Status
        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = `order-status status-${order.status}`;
        spanStatus.textContent = order.status;
        tdStatus.appendChild(spanStatus);
        row.appendChild(tdStatus);

        // Date
        const tdDate = document.createElement('td');
        tdDate.textContent = date;
        row.appendChild(tdDate);

        // Actions
        const tdActions = document.createElement('td');
        const btnEdit = document.createElement('button');
        btnEdit.className = 'action-btn edit';
        btnEdit.innerHTML = '<i class="fa-solid fa-edit"></i> Update'; // Safe static HTML
        btnEdit.onclick = () => openStatusModal(order._id, order.status);
        tdActions.appendChild(btnEdit);
        row.appendChild(tdActions);

        tbody.appendChild(row);
    });
}

// Format service type
function formatServiceType(type) {
    const types = {
        'wash-fold': 'Wash & Fold',
        'dry-clean': 'Dry Cleaning',
        'comforter': 'Comforter',
        'mixed': 'Mixed'
    };
    return types[type] || type;
}

// Filter orders
function filterOrders() {
    const filter = document.getElementById('status-filter').value;

    if (filter === 'all') {
        renderOrders(allOrders);
    } else {
        const filtered = allOrders.filter(o => o.status === filter);
        renderOrders(filtered);
    }
}

// Open status modal
function openStatusModal(orderId, currentStatus) {
    currentOrderId = orderId;
    document.getElementById('modal-order-id').textContent = '#' + orderId.slice(-8).toUpperCase();
    document.getElementById('new-status').value = currentStatus;
    document.getElementById('status-modal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('status-modal').style.display = 'none';
    currentOrderId = null;
}

// Update order status
async function updateOrderStatus() {
    if (!currentOrderId) return;

    const newStatus = document.getElementById('new-status').value;
    const confirmBtn = document.getElementById('confirm-status');

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    try {
        const response = await fetch(`/api/admin/orders/${currentOrderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            // Update local data
            const orderIndex = allOrders.findIndex(o => o._id === currentOrderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = newStatus;
            }

            // Re-render and close modal
            filterOrders();
            closeModal();
            await loadStats();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating order status');
    }

    confirmBtn.disabled = false;
    confirmBtn.innerHTML = 'Update Status';
}

// Exchange Rate Management
async function loadExchangeRate() {
    try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();

        if (data.success) {
            document.getElementById('current-exchange-rate').textContent = '₦' + data.rate.toLocaleString();
            document.getElementById('modal-current-rate').textContent = data.rate.toLocaleString();
            document.getElementById('new-exchange-rate').value = data.rate;
        }
    } catch (error) {
        console.error('Error loading exchange rate:', error);
    }
}

function openExchangeRateModal() {
    document.getElementById('exchange-rate-modal').style.display = 'flex';
}

function closeExchangeRateModal() {
    document.getElementById('exchange-rate-modal').style.display = 'none';
}

async function updateExchangeRate() {
    const newRate = parseFloat(document.getElementById('new-exchange-rate').value);
    const confirmBtn = document.getElementById('confirm-rate-update');

    if (!newRate || newRate <= 0) {
        alert('Please enter a valid rate');
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    try {
        const response = await fetch('/api/exchange-rate', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ rate: newRate })
        });

        const data = await response.json();

        if (data.success) {
            alert('Exchange rate updated successfully');
            closeExchangeRateModal();
            await loadExchangeRate();
            await loadStats(); // Re-load stats as they may depend on currency
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        alert('Error updating exchange rate');
    }

    confirmBtn.disabled = false;
    confirmBtn.innerHTML = 'Update Rate';
}

// Setup Exchange Rate Modal Listeners
document.getElementById('cancel-rate-modal').addEventListener('click', closeExchangeRateModal);
document.getElementById('confirm-rate-update').addEventListener('click', updateExchangeRate);

// Add to DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    // ... (existing code) ...

    // Load Exchange Rate
    await loadExchangeRate();
});
