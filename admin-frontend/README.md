# Chrome Pass Admin Frontend

React-based admin dashboard for Chrome Pass password sharing system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The admin dashboard will be available at `http://localhost:3000`

## 📋 Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **Backend API**: Must be running on port 3001

## 🔧 Installation

1. **Navigate to frontend directory**:
   ```bash
   cd admin-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

## 🛠️ Available Scripts

```bash
# Development
npm start          # Start development server (port 3000)
npm run dev        # Same as npm start

# Production
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (not recommended)
```

## 🎨 Technology Stack

- **React**: 18.2.0
- **React Router**: 6.8.1 (Client-side routing)
- **Axios**: 1.6.2 (HTTP client)
- **React Hook Form**: 7.48.2 (Form handling)
- **React Query**: 3.39.3 (Data fetching and caching)
- **React Hot Toast**: 2.4.1 (Notifications)
- **Lucide React**: 0.294.0 (Icons)
- **Tailwind CSS**: 3.3.6 (Styling)
- **Clsx & Tailwind Merge**: Utility functions

## 📁 Project Structure

```
admin-frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.js       # Main layout wrapper
│   │   ├── Modal.js        # Base modal component
│   │   ├── Pagination.js   # Pagination component
│   │   ├── ProtectedRoute.js # Route protection
│   │   ├── CreateUserModal.js
│   │   ├── EditUserModal.js
│   │   ├── CreateProjectModal.js
│   │   ├── EditProjectModal.js
│   │   ├── AssignmentModal.js
│   │   ├── TeamAssignmentModal.js
│   │   ├── TeamRemovalModal.js
│   │   └── ProfileEditModal.js
│   ├── contexts/
│   │   └── AuthContext.js  # Authentication context
│   ├── pages/              # Page components
│   │   ├── Login.js        # Login page
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── Users.js        # User management
│   │   ├── Teams.js        # Team management
│   │   ├── Projects.js     # Project management
│   │   ├── Credentials.js  # Credential management
│   │   └── Profile.js      # User profile
│   ├── utils/
│   │   └── api.js          # API utility functions
│   ├── App.js              # Main app component
│   ├── index.js            # App entry point
│   └── index.css           # Global styles
├── build/                  # Production build output
├── package.json
├── tailwind.config.js      # Tailwind configuration
└── postcss.config.js       # PostCSS configuration
```

## 🔐 Authentication

The frontend uses JWT-based authentication:

1. **Login**: User enters credentials
2. **Token Storage**: JWT stored in localStorage
3. **API Requests**: Token included in Authorization header
4. **Route Protection**: Protected routes require valid token
5. **Auto-logout**: Token expiration handling

### Default Login Credentials
- **Email**: `admin@chromepass.com`
- **Password**: `admin123`

## 📊 Features

### Dashboard
- Overview of users, teams, projects, and credentials
- Quick statistics and recent activity
- Navigation to all management sections

### User Management
- Create, read, update, delete users
- Assign users to teams
- Manage user roles (admin/user)
- User profile management

### Team Management
- Create and manage teams/groups
- Assign users to teams
- Remove users from teams
- Team-based access control

### Project Management
- Organize credentials by projects
- Create and manage projects
- Project-based credential filtering

### Credential Management
- Add, edit, and delete credentials
- Assign credentials to users or teams
- URL pattern matching for auto-fill
- Secure password storage

## 🎨 UI Components

### Layout Components
- **Layout**: Main app layout with navigation
- **Modal**: Reusable modal dialog
- **Pagination**: Data pagination controls

### Form Components
- **CreateUserModal**: User creation form
- **EditUserModal**: User editing form
- **CreateProjectModal**: Project creation form
- **EditProjectModal**: Project editing form
- **AssignmentModal**: Credential assignment form
- **TeamAssignmentModal**: Team assignment form
- **ProfileEditModal**: Profile editing form

### Utility Components
- **ProtectedRoute**: Route authentication guard
- **Pagination**: Data pagination

## 🔌 API Integration

The frontend communicates with the backend API through:

### API Utility (`src/utils/api.js`)
- Centralized API configuration
- Request/response interceptors
- Error handling
- Token management

### API Endpoints Used
- `POST /api/auth/login` - User authentication
- `GET /api/users` - Fetch users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/teams` - Fetch teams
- `POST /api/teams` - Create team
- `GET /api/projects` - Fetch projects
- `POST /api/projects` - Create project
- `GET /api/credentials` - Fetch credentials
- `POST /api/credentials` - Create credential

## 🎯 State Management

### React Context
- **AuthContext**: Global authentication state
- User information
- Login/logout functions
- Token management

### React Query
- Server state management
- Data caching
- Background refetching
- Optimistic updates

## 🎨 Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Dark/light mode support
- Custom component styles

### Custom Styles
- Global styles in `index.css`
- Component-specific styles
- Responsive breakpoints
- Animation and transitions

## 🔧 Configuration

### Environment Variables
The frontend proxies API requests to `http://localhost:3001` (configured in `package.json`).

### Tailwind Configuration
Custom Tailwind config in `tailwind.config.js`:
- Custom color palette
- Font families
- Spacing scale
- Component variants

## 🚀 Building for Production

```bash
# Build the app
npm run build

# The build folder contains the production build
# Serve with any static file server
```

### Build Output
- Optimized and minified JavaScript
- CSS extraction and optimization
- Asset optimization
- Source maps (for debugging)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**:
   - Ensure backend is running on port 3001
   - Check CORS configuration
   - Verify API endpoints

2. **Authentication Issues**:
   - Clear localStorage and try again
   - Check JWT token expiration
   - Verify backend authentication

3. **Build Errors**:
   - Clear node_modules and reinstall
   - Check for syntax errors
   - Verify all dependencies

4. **Styling Issues**:
   - Check Tailwind CSS configuration
   - Verify PostCSS setup
   - Clear browser cache

### Development Tools

- **React Developer Tools**: Browser extension
- **Redux DevTools**: For state debugging
- **Network Tab**: API request debugging
- **Console**: Error logging and debugging

## 📱 Responsive Design

The admin dashboard is fully responsive:
- **Mobile**: Optimized for mobile devices
- **Tablet**: Tablet-friendly layout
- **Desktop**: Full-featured desktop experience

## 🔒 Security Considerations

- **JWT Storage**: Tokens stored in localStorage
- **HTTPS**: Use HTTPS in production
- **Input Validation**: Client and server-side validation
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Handled by backend

## 🚀 Deployment

### Static Hosting
1. Build the application: `npm run build`
2. Deploy the `build/` folder to your hosting service
3. Configure API URL for production

### Environment Configuration
Update API endpoints for production:
```javascript
// In src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

## 📞 Support

For frontend-specific issues:
1. Check this README
2. Verify backend API is running
3. Check browser console for errors
4. Ensure all dependencies are installed
5. Clear browser cache and localStorage
