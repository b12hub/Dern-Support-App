// Main JavaScript file for Dern-Support application

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const authLinks = document.getElementById('authLinks');
const registerLinks = document.getElementById('registerLinks');
const loadingOverlay = document.getElementById('loadingOverlay');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});

// Initialize the application
function initApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        updateNavForLoggedInUser(user);
    }
}
// Update navigation for logged in user
function updateNavForLoggedInUser(user) {
    if(!authLinks || !registerLinks) return;

    // Clear existing auth links
    authLinks.innerHTML = '';
    registerLinks.innerHTML = '';

    // Create dropdown for user menu
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    const userLink = document.createElement('a');
    userLink.href = '#';
    userLink.className = 'nav-link';
    userLink.innerHTML = `${user.profile.firstName} <i class="fas fa-caret-down"></i>`;

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'dropdown-content';

    // Add appropriate links based on user type
    if (user.userType === 'admin') {
        dropdownContent.innerHTML = `
      <a href="../pages/admin/dashboard.html">Admin Dashboard</a>
      <a href="../pages/support/my-requests.html">Support Requests</a>
      <a href="../pages/admin/users.html">User Management</a>
      <a href="../pages/admin/inventory.html">Inventory</a>
      <a href="../pages/admin/analytics.html">Analytics</a>
      <a href="#" id="logoutLink">Logout</a>
    `;
    } else if (user.userType === 'technician') {
        dropdownContent.innerHTML = `
      <a href="../pages/admin/dashboard.html">Dashboard</a>
      <a href="../pages/support/my-requests.html">Assigned Requests</a>
      <a href="../pages/admin/scheduling.html">My Schedule</a>
      <a href="#" id="logoutLink">Logout</a>
    `;
    } else if (user.userType === 'business' || user.userType === 'individual') {
        dropdownContent.innerHTML = `
      <a href="../pages/dashboard.html">Dashboard</a>
      <a href="../pages/support/my-requests.html">My Requests</a>
      <a href="../pages/support/new-request.html">New Request</a>
      <a href="#" id="logoutLink">Logout</a>
    `;
    }

    dropdown.appendChild(userLink);
    dropdown.appendChild(dropdownContent);
    authLinks.appendChild(dropdown);

    // Add event listener for logout
    document.getElementById('logoutLink').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Add "New Request" button for regular users
    if (user.userType === 'business' || user.userType === 'individual') {
        const newRequestItem = document.createElement('div');
        newRequestItem.className = 'nav-item';

        const newRequestLink = document.createElement('a');
        newRequestLink.href = 'pages/support/new-request.html';
        newRequestLink.className = 'nav-link';
        newRequestLink.innerHTML = 'New Request';

        newRequestItem.appendChild(newRequestLink);
        registerLinks.appendChild(newRequestItem);
    }
}

// Logout function
function logout() {
    showLoading();

    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to home page
    setTimeout(() => {
        hideLoading();
        window.location.href = 'index.html';
    }, 500);
}

// Show loading overlay
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format status for display
function formatStatus(status) {
    switch (status) {
        case 'new':
            return '<span class="request-status status-new">New</span>';
        case 'assigned':
            return '<span class="request-status status-assigned">Assigned</span>';
        case 'in_progress':
            return '<span class="request-status status-in-progress">In Progress</span>';
        case 'on_hold':
            return '<span class="request-status status-on-hold">On Hold</span>';
        case 'resolved':
            return '<span class="request-status status-resolved">Resolved</span>';
        case 'closed':
            return '<span class="request-status status-closed">Closed</span>';
        default:
            return '<span class="request-status">' + status + '</span>';
    }
}

// Format priority for display
function formatPriority(priority) {
    switch (priority) {
        case 'low':
            return '<span class="request-status priority-low">Low</span>';
        case 'medium':
            return '<span class="request-status priority-medium">Medium</span>';
        case 'high':
            return '<span class="request-status priority-high">High</span>';
        case 'critical':
            return '<span class="request-status priority-critical">Critical</span>';
        default:
            return '<span class="request-status">' + priority + '</span>';
    }
}

// Display error message
function showError(message, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        element.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Display success message
function showSuccess(message, elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="alert alert-success">${message}</div>`;
        element.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
