// Support Requests API utility functions

// API Base URL - Change this to match your backend server
const API_BASE_URL = 'http://localhost:5000/api';

// Get user support requests
async function getUserRequests(options = {}) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        // Build query string from options
        const queryParams = new URLSearchParams();
        if (options.status) queryParams.append('status', options.status);
        if (options.page) queryParams.append('page', options.page);
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.sortBy) queryParams.append('sortBy', options.sortBy);
        if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const response = await fetch(`${API_BASE_URL}/support-requests${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get support requests');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get support requests error:', error);
        return { success: false, error: error.message };
    }
}

// Get a specific support request by ID
async function getSupportRequestById(id) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/support-requests/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get support request');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get support request error:', error);
        return { success: false, error: error.message };
    }
}

// Create a new support request
async function createSupportRequest(requestData, attachments = null) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        // If we have attachments, use FormData
        let response;

        if (attachments && attachments.length > 0) {
            const formData = new FormData();

            // Add request data
            Object.keys(requestData).forEach(key => {
                if (key === 'dynamicFields' && typeof requestData[key] === 'object') {
                    formData.append(key, JSON.stringify(requestData[key]));
                } else {
                    formData.append(key, requestData[key]);
                }
            });

            // Add attachments
            for (let i = 0; i < attachments.length; i++) {
                formData.append('attachments', attachments[i]);
            }

            response = await fetch(`${API_BASE_URL}/support-requests`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token
                },
                body: formData
            });
        } else {
            // No attachments, use JSON
            response = await fetch(`${API_BASE_URL}/support-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(requestData)
            });
        }

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create support request');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Create support request error:', error);
        return { success: false, error: error.message };
    }
}

// Update a support request
async function updateSupportRequest(id, updateData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/support-requests/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update support request');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Update support request error:', error);
        return { success: false, error: error.message };
    }
}

// Add attachment to a support request
async function addAttachmentToRequest(id, attachments) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const formData = new FormData();

        // Add attachments
        for (let i = 0; i < attachments.length; i++) {
            formData.append('attachments', attachments[i]);
        }

        const response = await fetch(`${API_BASE_URL}/support-requests/${id}/attachments`, {
            method: 'POST',
            headers: {
                'x-auth-token': token
            },
            body: formData
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to add attachment');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Add attachment error:', error);
        return { success: false, error: error.message };
    }
}

// Get request history
async function getRequestHistory(id) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/support-requests/${id}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get request history');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get request history error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Get all support requests
async function getAllSupportRequests(options = {}) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        // Build query string from options
        const queryParams = new URLSearchParams();
        if (options.status) queryParams.append('status', options.status);
        if (options.priority) queryParams.append('priority', options.priority);
        if (options.assignedTo) queryParams.append('assignedTo', options.assignedTo);
        if (options.page) queryParams.append('page', options.page);
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.sortBy) queryParams.append('sortBy', options.sortBy);
        if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const response = await fetch(`${API_BASE_URL}/support-requests/admin/all${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get support requests');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get all support requests error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Assign request to technician
async function assignRequestToTechnician(requestId, technicianId) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/support-requests/${requestId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ technicianId })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to assign request');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Assign request error:', error);
        return { success: false, error: error.message };
    }
}
