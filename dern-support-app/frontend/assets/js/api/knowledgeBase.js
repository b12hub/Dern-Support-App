// Knowledge Base API utility functions

// API Base URL - Change this to match your backend server
const API_BASE_URL = 'http://localhost:5000/api';

// Get all knowledge base categories
async function getKnowledgeCategories() {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get knowledge categories');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get knowledge categories error:', error);
        return { success: false, error: error.message };
    }
}

// Get knowledge base articles with filtering and search
async function getKnowledgeArticles(options = {}) {
    try {
        showLoading();

        // Build query string from options
        const queryParams = new URLSearchParams();
        if (options.category) queryParams.append('category', options.category);
        if (options.search) queryParams.append('search', options.search);
        if (options.tags) queryParams.append('tags', options.tags);
        if (options.page) queryParams.append('page', options.page);
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.sortBy) queryParams.append('sortBy', options.sortBy);
        if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const response = await fetch(`${API_BASE_URL}/knowledge-base/articles${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get knowledge articles');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get knowledge articles error:', error);
        return { success: false, error: error.message };
    }
}

// Get a specific knowledge base article by ID
async function getKnowledgeArticleById(id) {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/articles/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get knowledge article');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Get knowledge article error:', error);
        return { success: false, error: error.message };
    }
}

// Submit feedback for an article
async function submitArticleFeedback(articleId, feedback) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/articles/${articleId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(feedback)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit feedback');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Submit article feedback error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Create a new knowledge base article
async function createKnowledgeArticle(articleData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/admin/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(articleData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create knowledge article');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Create knowledge article error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Update a knowledge base article
async function updateKnowledgeArticle(articleId, updateData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/admin/articles/${articleId}`, {
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
            throw new Error(data.message || 'Failed to update knowledge article');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Update knowledge article error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Create a new category
async function createKnowledgeCategory(categoryData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(categoryData)
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create knowledge category');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Create knowledge category error:', error);
        return { success: false, error: error.message };
    }
}

// Admin: Update a category
async function updateKnowledgeCategory(categoryId, updateData) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/knowledge-base/admin/categories/${categoryId}`, {
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
            throw new Error(data.message || 'Failed to update knowledge category');
        }

        return { success: true, data };
    } catch (error) {
        hideLoading();
        console.error('Update knowledge category error:', error);
        return { success: false, error: error.message };
    }
}
