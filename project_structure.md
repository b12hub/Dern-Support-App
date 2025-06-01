# Dern-Support Application Project Structure

This document outlines the project structure for the Dern-Support application, using HTML/CSS/JavaScript for the frontend and Node.js/Express for the backend.

## Project Root Structure

```
dern-support-app/
├── backend/           # Node.js/Express backend
├── frontend/          # HTML/CSS/JavaScript frontend
├── package.json       # Root package.json for project scripts
├── README.md          # Project documentation
└── .gitignore         # Git ignore file
```

## Backend Structure

```
backend/
├── config/            # Configuration files
│   ├── db.js          # Database connection configuration
│   ├── auth.js        # Authentication configuration
│   └── app.js         # Express app configuration
├── controllers/       # Route controllers
│   ├── authController.js
│   ├── supportRequestController.js
│   ├── knowledgeBaseController.js
│   ├── adminController.js
│   └── schedulingController.js
├── middleware/        # Custom middleware
│   ├── auth.js        # Authentication middleware
│   ├── errorHandler.js # Error handling middleware
│   ├── fileUpload.js  # File upload middleware
│   └── validation.js  # Input validation middleware
├── models/            # Database models
│   ├── User.js
│   ├── SupportRequest.js
│   ├── KnowledgeArticle.js
│   ├── KnowledgeCategory.js
│   ├── Inventory.js
│   └── Notification.js
├── routes/            # API routes
│   ├── authRoutes.js
│   ├── supportRequestRoutes.js
│   ├── knowledgeBaseRoutes.js
│   ├── adminRoutes.js
│   └── schedulingRoutes.js
├── services/          # Business logic services
│   ├── authService.js
│   ├── supportRequestService.js
│   ├── knowledgeBaseService.js
│   ├── notificationService.js
│   ├── schedulingService.js
│   └── fileService.js
├── utils/             # Utility functions
│   ├── logger.js
│   ├── emailSender.js
│   ├── validators.js
│   └── helpers.js
├── uploads/           # File upload directory (gitignored)
├── package.json       # Backend dependencies
├── server.js          # Entry point for the backend
└── .env.example       # Example environment variables
```

## Frontend Structure

```
frontend/
├── assets/            # Static assets
│   ├── css/           # CSS stylesheets
│   │   ├── main.css   # Main stylesheet
│   │   ├── auth.css   # Authentication pages styles
│   │   ├── dashboard.css # Dashboard styles
│   │   └── admin.css  # Admin panel styles
│   ├── js/            # JavaScript files
│   │   ├── api/       # API client functions
│   │   │   ├── auth.js
│   │   │   ├── supportRequests.js
│   │   │   ├── knowledgeBase.js
│   │   │   └── admin.js
│   │   ├── components/ # Reusable UI components
│   │   │   ├── navbar.js
│   │   │   ├── sidebar.js
│   │   │   ├── modal.js
│   │   │   ├── forms.js
│   │   │   └── tables.js
│   │   ├── pages/     # Page-specific JavaScript
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── supportRequests.js
│   │   │   ├── knowledgeBase.js
│   │   │   └── admin.js
│   │   ├── utils/     # Utility functions
│   │   │   ├── validation.js
│   │   │   ├── storage.js
│   │   │   ├── formatter.js
│   │   │   └── notifications.js
│   │   └── main.js    # Main JavaScript file
│   ├── images/        # Image assets
│   └── vendors/       # Third-party libraries
│       ├── bootstrap/ # Bootstrap (optional)
│       └── charts/    # Chart library
├── pages/             # HTML pages
│   ├── index.html     # Landing page
│   ├── auth/          # Authentication pages
│   │   ├── login.html
│   │   ├── register-business.html
│   │   ├── register-individual.html
│   │   └── reset-password.html
│   ├── dashboard.html # User dashboard
│   ├── support/       # Support request pages
│   │   ├── new-request.html
│   │   ├── my-requests.html
│   │   └── request-detail.html
│   ├── knowledge/     # Knowledge base pages
│   │   ├── index.html
│   │   └── article.html
│   └── admin/         # Admin pages
│       ├── dashboard.html
│       ├── users.html
│       ├── requests.html
│       ├── knowledge.html
│       ├── inventory.html
│       ├── analytics.html
│       └── scheduling.html
└── favicon.ico        # Favicon
```

## Key Design Decisions

1. **Separation of Concerns**:
    - Clear separation between frontend and backend
    - Backend organized by feature (auth, support requests, etc.)
    - Frontend organized by page type and functionality

2. **Modular Architecture**:
    - Backend uses controller-service pattern for business logic
    - Frontend separates API calls, UI components, and page logic
    - Reusable components and utilities in both frontend and backend

3. **Scalability Considerations**:
    - Directory structure supports adding new features
    - Services layer allows for complex business logic
    - API client structure supports easy addition of new endpoints

4. **Development Workflow**:
    - Backend can be developed and tested independently
    - Frontend can use mock data during development
    - Structure supports parallel development of features

This structure provides a solid foundation for implementing the Dern-Support application with all the required features while maintaining good separation of concerns and modularity.

# Dern-Support Application Requirements Analysis

Based on the technical report, I've identified the following key requirements for implementing the Dern-Support application using HTML/CSS/JavaScript for the frontend and Node.js/Express for the backend.

## 1. User Roles and Authentication

### User Types:
- Business users
- Individual users
- Admin users
- Support technicians

### Authentication Requirements:
- User registration with different flows for business and individual users
- Email verification
- Secure login with JWT
- Password hashing with bcrypt
- Role-based access control
- Password reset functionality

## 2. Core Features

### 2.1 Support Request Management
- Support request submission with dynamic fields based on request type
- File attachment capabilities
- Request tracking and status updates
- Notification system for updates
- Filtering and sorting of requests

### 2.2 Knowledge Base System
- Article browsing with categories and tags
- Search functionality
- Article rating/feedback
- Admin interface for article management
- Related articles suggestions

### 2.3 Job Scheduling and Prioritization
- Automatic scheduling algorithm
- Manual resource allocation interface
- Technician assignment
- Priority management
- Calendar integration

### 2.4 Admin Features
- Spare parts inventory management
- Analytics dashboard with charts
- User management
- Reporting functionality
- System configuration

## 3. API Endpoints

### Authentication Endpoints
- POST /api/auth/register/business - Business registration
- POST /api/auth/register/individual - Individual registration
- POST /api/auth/login - User login
- POST /api/auth/verify - Email verification
- POST /api/auth/password-reset - Password reset request
- POST /api/auth/password-reset/confirm - Password reset confirmation

### Support Request Endpoints
- GET /api/support-requests - List user's support requests
- POST /api/support-requests - Create new support request
- GET /api/support-requests/:id - Get specific request details
- PUT /api/support-requests/:id - Update support request
- POST /api/support-requests/:id/attachments - Add attachment
- GET /api/support-requests/:id/history - Get request history

### Knowledge Base Endpoints
- GET /api/knowledge-base/categories - List categories
- GET /api/knowledge-base/articles - List/search articles
- GET /api/knowledge-base/articles/:id - Get article details
- POST /api/knowledge-base/articles/:id/feedback - Submit article feedback
- POST /api/admin/knowledge-base/articles - Create article (admin)
- PUT /api/admin/knowledge-base/articles/:id - Update article (admin)

### Admin Endpoints
- GET /api/admin/dashboard - Get dashboard data
- GET /api/admin/users - List users
- PUT /api/admin/users/:id - Update user
- GET /api/admin/analytics - Get analytics data
- GET /api/admin/inventory/parts - List inventory
- POST /api/admin/inventory/parts - Add inventory item
- PUT /api/admin/inventory/parts/:id - Update inventory item

### Scheduling Endpoints
- GET /api/admin/technicians - List technicians
- GET /api/admin/schedule - Get schedule
- POST /api/admin/assign-request - Assign technician to request
- GET /api/technician/assignments - Get technician assignments

## 4. Database Models

### User Model
- ID, email, password (hashed), userType
- Profile data (varies by user type)
- Verification status
- Created/updated timestamps

### Support Request Model
- ID, user reference, title, description
- Request type, priority, status
- Dynamic fields (based on request type)
- Attachments
- Assigned technician reference
- Created/updated timestamps

### Knowledge Article Model
- ID, title, content, summary
- Category reference
- Tags array
- Author reference
- Published status
- View count
- Created/updated timestamps

### Inventory Model
- ID, name, part number, category
- Compatible devices array
- Quantity, reorder level
- Unit price, supplier, location

## 5. Frontend Pages

### Public Pages
- Home/Landing page
- Login page
- Registration pages (business/individual)
- Password reset pages

### User Pages
- Dashboard
- Support request submission form
- Support request list/tracking
- Support request detail view
- Knowledge base browsing
- Knowledge base article view
- User profile/settings

### Admin Pages
- Admin dashboard
- Support request management
- User management
- Knowledge base management
- Inventory management
- Analytics dashboard
- Scheduling interface

## 6. Technical Requirements

### Frontend
- Responsive design for mobile and desktop
- Form validation
- Error handling
- Loading states
- Notifications
- Data visualization for analytics

### Backend
- RESTful API design
- Authentication middleware
- Input validation
- Error handling
- File upload handling
- Database connection and models
- Logging

### Security
- JWT authentication
- Password hashing
- CORS configuration
- Input sanitization
- Rate limiting
- Secure headers

This analysis will guide the implementation of the Dern-Support application using HTML/CSS/JavaScript for the frontend and Node.js/Express for the backend.

# Dern-Support Application Setup and Usage Guide

## Overview
This document provides instructions for setting up and using the Dern-Support full stack web application. The application consists of a Node.js/Express backend API and an HTML/CSS/JavaScript frontend.

## System Requirements
- Node.js (v14.0.0 or higher)
- MongoDB (v4.4 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd dern-support-app/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dern-support
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   EMAIL_SERVICE=your_email_service
   EMAIL_USERNAME=your_email_username
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=noreply@dern-support.com
   ```

4. Start the backend server:
   ```
   npm start
   ```
   For development with auto-reload:
   ```
   npm run dev
   ```

### Frontend Setup
1. The frontend is built with vanilla HTML, CSS, and JavaScript and can be served using any web server.

2. For development, you can use a simple HTTP server:
   ```
   cd dern-support-app/frontend
   npx http-server -p 8080
   ```

3. For production, deploy the frontend files to your web server of choice.

## Configuration

### API Endpoint Configuration
1. Open `frontend/assets/js/config.js` and update the API base URL if needed:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

### Database Configuration
1. The application uses MongoDB by default. Update the `MONGODB_URI` in the `.env` file to point to your MongoDB instance.

2. To initialize the database with sample data:
   ```
   cd backend
   npm run seed
   ```

## Usage Guide

### User Roles
The application supports three user roles:
- **Individual Users**: Regular customers seeking support
- **Business Users**: Business customers with additional features
- **Admin Users**: Support staff with administrative privileges

### Authentication
1. **Registration**:
   - Individual users: Navigate to `/pages/auth/register-individual.html`
   - Business users: Navigate to `/pages/auth/register-business.html`

2. **Login**:
   - Navigate to `/pages/auth/login.html`
   - Enter email and password

3. **Password Reset**:
   - Navigate to `/pages/auth/reset-password.html`
   - Follow the instructions to reset your password

### Support Requests
1. **Creating a Support Request**:
   - Navigate to `/pages/support/new-request.html`
   - Fill in the required information
   - Add attachments if needed
   - Submit the form

2. **Viewing Support Requests**:
   - Navigate to `/pages/support/my-requests.html`
   - Click on a request to view details

3. **Updating a Support Request**:
   - Open a support request
   - Add replies in the conversation section
   - Attachments can be added to replies

### Knowledge Base
1. **Browsing Articles**:
   - Navigate to `/pages/knowledge/index.html`
   - Browse by category or use the search function

2. **Reading Articles**:
   - Click on an article to view its content
   - Related articles are displayed at the bottom

3. **Providing Feedback**:
   - At the bottom of each article, indicate if it was helpful
   - Optionally provide additional feedback

### Admin Features
1. **Dashboard**:
   - Navigate to `/pages/admin/dashboard.html`
   - View key metrics and recent activities

2. **Managing Support Requests**:
   - Navigate to `/pages/admin/support-requests.html`
   - Assign, prioritize, and update support requests

3. **User Management**:
   - Navigate to `/pages/admin/users.html`
   - View and edit user information

4. **Inventory Management**:
   - Navigate to `/pages/admin/inventory.html`
   - Add, edit, and track inventory items

5. **Scheduling**:
   - Navigate to `/pages/admin/scheduling.html`
   - View and manage technician schedules

6. **Knowledge Base Management**:
   - Navigate to `/pages/admin/knowledge-base.html`
   - Create, edit, and organize knowledge articles

7. **Reports**:
   - Navigate to `/pages/admin/reports.html`
   - Generate and export various reports

## Troubleshooting

### Common Issues
1. **API Connection Errors**:
   - Verify the backend server is running
   - Check the API base URL in `config.js`
   - Ensure CORS is properly configured

2. **Authentication Issues**:
   - Clear browser cache and cookies
   - Verify JWT secret and expiration in `.env`

3. **Database Connection Issues**:
   - Verify MongoDB is running
   - Check the MongoDB connection string in `.env`

### Support
For additional support or questions, please contact:
- Email: support@dern-support.com
- Documentation: https://docs.dern-support.com
