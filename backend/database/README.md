# Chrome Pass Database Setup

This directory contains the MySQL database initialization scripts and configuration for Chrome Pass.

## 🗄️ Database Schema

### Tables

- **users** - User accounts and authentication
- **groups** - Team/group definitions
- **credentials** - Password credentials and access rules
- **user_groups** - Many-to-many relationship between users and groups
- **credential_users** - Many-to-many relationship between credentials and users
- **credential_groups** - Many-to-many relationship between credentials and groups

### Key Features

- **Consistent Naming**: All tables and fields use snake_case
- **Proper Indexing**: Optimized for performance
- **Foreign Keys**: Maintains referential integrity
- **Timestamps**: Automatic created_at and updated_at tracking
- **Soft Deletes**: Uses is_active flags instead of hard deletes

## 🚀 Quick Setup

### 1. Prerequisites

- MySQL 8.0 or higher
- Node.js 16 or higher
- npm or yarn

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

```bash
cp env.example .env
# Edit .env with your MySQL credentials
```

### 4. Initialize Database

```bash
npm run setup-db
```

This will:

- Create the `chrome_pass` database
- Create all tables with proper relationships
- Insert sample data (admin user, test users, groups, credentials)
- Set up indexes for optimal performance

## 📋 Manual Setup

If you prefer to set up the database manually:

### 1. Create Database

```sql
CREATE DATABASE chrome_pass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chrome_pass;
```

### 2. Run SQL Script

```bash
mysql -u root -p chrome_pass < init.sql
```

## 🔧 Environment Variables

Update your `.env` file with these MySQL settings:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chrome_pass
DB_USER=root
DB_PASSWORD=your-mysql-password
```

## 📊 Sample Data

The initialization script includes:

### Users

- **Admin**: admin@chromepass.com / admin123
- **Test Users**: 5 sample users for testing

### Groups

- Development Team
- DevOps Team
- Project Management
- Sales Team
- Finance Team
- IT Administration

### Credentials

- 8 sample credentials with different access types
- Realistic URLs and strong passwords
- Proper project categorization

## 🔍 Database Structure

### Users Table

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255) NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Groups Table

```sql
CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_by_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Credentials Table

```sql
CREATE TABLE credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    label VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    url_pattern VARCHAR(500) NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(500) NOT NULL,
    description TEXT NULL,
    project VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INT NOT NULL,
    access_type ENUM('individual', 'group', 'all') DEFAULT 'individual',
    last_used TIMESTAMP NULL,
    use_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **SQL Injection Protection**: Uses parameterized queries
- **Foreign Key Constraints**: Maintains data integrity
- **Index Optimization**: Fast queries with proper indexing
- **Role-Based Access**: Admin and user roles with proper permissions

## 📈 Performance Optimizations

- **Indexes**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Optimized connection management
- **Query Optimization**: Efficient JOIN operations
- **View Creation**: Pre-computed views for complex queries

## 🛠️ Maintenance

### Backup Database

```bash
mysqldump -u root -p chrome_pass > chrome_pass_backup.sql
```

### Restore Database

```bash
mysql -u root -p chrome_pass < chrome_pass_backup.sql
```

### Reset Database

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS chrome_pass;"
npm run setup-db
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
    - Check if MySQL is running
    - Verify host and port settings

2. **Access Denied**
    - Check username and password
    - Ensure user has CREATE privileges

3. **Database Not Found**
    - Run the setup script first
    - Check database name in .env

4. **Table Already Exists**
    - Database was already initialized
    - This is normal for subsequent runs

### Logs

Check the console output for detailed error messages and setup progress.

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Sequelize Documentation](https://sequelize.org/)
- [Node.js MySQL2](https://github.com/sidorares/node-mysql2)
