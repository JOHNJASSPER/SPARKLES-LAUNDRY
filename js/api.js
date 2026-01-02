// API Base URL - uses relative path so it works in both dev and production
const API_URL = '/api';

// HTTP request wrapper with JWT token
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    // Add authorization header if token exists
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// API methods
const api = {
    // Auth endpoints
    auth: {
        register: (userData) => apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        login: (credentials) => apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        googleAuth: (googleData) => apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify(googleData)
        }),

        verify: () => apiRequest('/auth/verify')
    },

    // Order endpoints
    orders: {
        create: (orderData) => apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        }),

        getAll: () => apiRequest('/orders'),

        getById: (id) => apiRequest(`/orders/${id}`),

        updateStatus: (id, status) => apiRequest(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        })
    },

    // Service endpoints
    services: {
        getAll: () => apiRequest('/services'),

        getByType: (type) => apiRequest(`/services/${type}`),

        calculate: (items) => apiRequest('/services/calculate', {
            method: 'POST',
            body: JSON.stringify({ items })
        })
    },

    // Config endpoint
    config: {
        get: () => apiRequest('/config')
    }
};

// Auth helper functions
const authHelpers = {
    // Save token and user data
    saveAuth: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Get current user
    getUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },

    // Redirect to login if not authenticated
    requireAuth: () => {
        if (!authHelpers.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, authHelpers, API_URL };
}
