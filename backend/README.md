# Chrome Pass Backend

Node.js API server for Chrome Pass password sharing system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials

# Set up database
npm run setup-db

# Start development server
npm run dev
```

## 📋 Prerequisites

- **Node.js**: 18.0 or higher
- **MySQL**: 8.0 or higher
- **npm**: 8.0 or higher

## 🔧 Installation

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables** in `.env`:
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
   
   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Frontend URLs
   FRONTEND_URL=http://localhost:3000
   ADMIN_URL=http://localhost:3002
   ```

## 🗄️ Database Setup

### Option 1: Automatic Setup (Recommended)
```bash
npm run setup-db
```

### Option 2: Manual Setup
1. **Create MySQL database**:
   ```sql
   CREATE DATABASE chrome_pass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run initialization script**:
   ```bash
   mysql -u root -p chrome_pass < database/init.sql
   ```

3. **Run migrations** (if needed):
   ```bash
   npm run migrate
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```
- Server runs on `http://localhost:3001`
- Auto-restart on file changes
- Detailed logging enabled

### Production Mode
```bash
npm start
```

## 📊 Database Schema

The backend uses the following main tables:

- **`cp_users`**: User accounts and authentication
- **`cp_groups`**: Teams/organizations
- **`cp_projects`**: Project categorization
- **`cp_credentials`**: Stored passwords and credentials
- **`cp_user_groups`**: User-team relationships
- **`cp_credential_users`**: Individual credential access
- **`cp_credential_groups`**: Team-based credential access

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Credentials
- `GET /api/credentials` - List user's accessible credentials
- `POST /api/credentials` - Create new credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm start               # Start production server

# Database
npm run setup-db        # Initialize database
npm run migrate         # Run migrations
npm run migrate:version # Check migration version

# Utilities
npm run create-admin    # Create admin user
npm run seed-credentials # Seed sample credentials
npm run create-test-users # Create test users
```

## 🔐 Default Admin Account

After running `npm run setup-db`, you can login with:
- **Email**: `admin@chromepass.com`
- **Password**: `admin123`

## 🧪 Testing

### Create Test Token
```bash
npm run create-test-token
```

### Check Database Status
```bash
# Check admin user
node check-admin.js

# Check tables
node check-tables.js

# Check teams
node check-teams.js
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Sequelize ORM
- **Helmet Security**: Security headers

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `chrome_pass` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**:
   - Change `PORT` in `.env`
   - Kill existing process: `lsof -ti:3001 | xargs kill`

3. **Migration Errors**:
   - Check database permissions
   - Verify MySQL version compatibility
   - Run `npm run migrate:version` to check status

### Logs
- Development: Console output with detailed logs
- Production: Configure logging as needed

## 📚 API Documentation

For detailed API documentation, see the individual route files:
- `src/routes/auth.js` - Authentication endpoints
- `src/routes/users.js` - User management
- `src/routes/teams.js` - Team management
- `src/routes/projects.js` - Project management
- `src/routes/credentials.js` - Credential management

## 🔄 Database Migrations

The project uses a custom migration system:

```bash
# Check current version
npm run migrate:version

# Run all pending migrations
npm run migrate

# Create new migration
# (Manual process - see database/migrations/ for examples)
```

## 🚀 Production Deployment

1. **Set production environment**:
   ```env
   NODE_ENV=production
   ```

2. **Configure production database**:
   - Use production MySQL instance
   - Set strong passwords
   - Enable SSL if needed

3. **Set secure JWT secret**:
   - Generate strong random secret
   - Store securely

4. **Start server**:
   ```bash
   npm start
   ```

## 📞 Support

For backend-specific issues:
1. Check this README
2. Review the `.extras/` folder for utility scripts
3. Check database connection and permissions
4. Verify environment variables are set correctly
