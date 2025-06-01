// Authentication utility functions

// API Base URL - Change this to match your backend server
const API_BASE_URL = 'http://localhost:5000/api';

// Register a new business user
async function registerBusiness(userData) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/register/business`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Register a new individual user
async function registerIndividual(userData) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/register/individual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Login user
async function login(credentials) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user data in local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Request password reset
async function requestPasswordReset(email) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Password reset request failed');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Password reset request error:', error);
        return { success: false, error: error.message };
    }
}

// Reset password with token
async function resetPassword(token, password) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/password-reset/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Password reset failed');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

// Get current user profile
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get user profile');
        }

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get user profile error:', error);
        return { success: false, error: error.message };
    }
}

// Update user profile
async function updateProfile(profileData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.user));

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Get user role
function getUserRole() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.userType : null;
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return false;
    }
    return true;
}

// Redirect if not admin
function requireAdmin() {
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return false;
    }

    const userRole = getUserRole();
    if (userRole !== 'admin') {
        window.location.href = '/pages/dashboard.html';
        return false;
    }

    return true;
}

// Redirect if not technician or admin
function requireTechnicianOrAdmin() {
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return false;
    }

    const userRole = getUserRole();
    if (userRole !== 'admin' && userRole !== 'technician') {
        window.location.href = '/pages/dashboard.html';
        return false;
    }

    return true;
}
