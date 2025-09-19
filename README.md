# Chrome Pass - Password Sharing Tool

A comprehensive password-sharing solution with backend API, admin frontend, and Chrome extension for secure team credential management.

## Features

- **Secure Authentication**: Email verification and JWT-based authentication
- **Credential Management**: Create, update, and delete shared credentials
- **Team Management**: Organize users into groups with granular access control
- **Chrome Extension**: Auto-fill credentials on matching websites
- **Admin Dashboard**: React-based interface for managing users and credentials
- **URL Pattern Matching**: Support for wildcard patterns (e.g., *.example.com)
- **Project Organization**: Group credentials by projects
- **Usage Tracking**: Monitor credential usage and access patterns

## Architecture

### Backend API (Node.js + Express + MySQL)

- RESTful API with JWT authentication
- MySQL database with Sequelize ORM
- Email verification system
- Role-based access control (Admin/User)
- Rate limiting and security middleware

### Admin Frontend (React)

- Modern React application with Tailwind CSS
- User and team management
- Credential CRUD operations
- Real-time dashboard with statistics
- Responsive design

### Chrome Extension

- Popup interface for quick credential access
- Content script for auto-filling forms
- Background service worker
- Settings page for configuration
- Secure credential storage

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- MySQL 5.7+ or 8.0+
- Chrome browser (for extension)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd chrome-pass
npm run install:all
```

2. **Set up environment variables:**

```bash
cd backend
cp env.example .env
# Edit .env with your configuration
```

3. **Create admin user and seed sample data:**

```bash
cd backend
npm run create-admin
npm run seed-credentials
```

4. **Start the backend server:**

```bash
npm run backend:dev
```

5. **Start the admin frontend:**

```bash
npm run admin:dev
```

6. **Load the Chrome extension:**
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the `chrome-extension` folder

### Default Credentials

**Admin Login:**

- Email: `admin@chromepass.com`
- Password: `admin123`

**Sample Credentials:**
The system comes pre-loaded with 8 sample credentials for testing. See `DEFAULT_CREDENTIALS.txt` for the complete list including:

- GitHub, AWS, Slack, JIRA, Docker Hub, Stripe, Google Workspace, Salesforce

These credentials are automatically created when you run `npm run seed-credentials`.

### Configuration

#### Backend (.env)

```env
NODE_ENV=development
PORT=3001

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chrome_pass
DB_USER=root
DB_PASSWORD=your-mysql-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3002
```

#### Chrome Extension

- Default API URL: `http://localhost:3001/api`
- Can be changed in extension settings

## Usage

### Admin Dashboard

1. Navigate to `http://localhost:3002`
2. Register a new admin account
3. Verify your email
4. Manage users, teams, and credentials

### Chrome Extension

1. Click the extension icon in Chrome
2. Sign in with your credentials
3. Visit any website with matching credentials
4. Click on credentials in the popup to auto-fill

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/me` - Get current user

#### Credentials

- `GET /api/credentials` - Get user's credentials
- `GET /api/credentials/for-url` - Get credentials for current URL
- `POST /api/credentials` - Create credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

#### Users

- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/activate` - Activate user (admin)
- `PATCH /api/users/:id/deactivate` - Deactivate user (admin)

#### Teams

- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member to team
- `DELETE /api/teams/:id/members/:userId` - Remove member from team

## Database Schema

### Users

- id, email, password, firstName, lastName
- isEmailVerified, emailVerificationToken
- role (admin/user), isActive, lastLogin
- timestamps

### Credentials

- id, label, url, urlPattern, username, password
- description, project, isActive, createdById
- accessType (individual/group/all)
- lastUsed, useCount, timestamps

### Groups

- id, name, description, createdById, isActive
- timestamps

### Junction Tables

- UserGroup (user_id, group_id)
- CredentialUser (credential_id, user_id)
- CredentialGroup (credential_id, group_id)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Email verification required
- Rate limiting on API endpoints
- CORS protection
- Input validation with Joi
- SQL injection protection with Sequelize

## Development

### Backend Development

```bash
cd backend
npm run dev
```

### Frontend Development

```bash
cd admin-frontend
npm start
```

### Extension Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension
4. Test your changes

## Deployment

### Backend

1. Set production environment variables
2. Build and start the server:

```bash
npm run build
npm start
```

### Frontend

1. Build the React app:

```bash
cd admin-frontend
npm run build
```

2. Serve the build folder with a web server

### Chrome Extension

1. Package the extension files
2. Upload to Chrome Web Store or distribute manually

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

1. Check the GitHub issues
2. Create a new issue with detailed description
3. Include logs and error messages

## Roadmap

- [ ] PostgreSQL support
- [ ] Two-factor authentication
- [ ] Audit logging
- [ ] API rate limiting per user
- [ ] Mobile app
- [ ] Browser extension for Firefox/Safari
- [ ] Advanced URL pattern matching
- [ ] Credential sharing via links
- [ ] Integration with password managers
