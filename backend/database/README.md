# KeyStack Database Setup

This directory contains the MySQL database installation script for KeyStack.

## 🗄️ Database Schema

### Tables

- **cp_users** - User accounts and authentication
- **cp_groups** - Team/group definitions  
- **cp_projects** - Project definitions
- **cp_credentials** - Password credentials and access rules
- **cp_user_groups** - Many-to-many relationship between users and groups
- **cp_project_users** - Many-to-many relationship between projects and users
- **cp_project_groups** - Many-to-many relationship between projects and groups
- **cp_credential_users** - Many-to-many relationship between credentials and users
- **cp_credential_groups** - Many-to-many relationship between credentials and groups
- **cp_schema_version** - Database version tracking

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
mysql -u root -p < install-001.sql
```

This will:

- Create the `keystack` database
- Create all tables with proper relationships
- Insert essential admin user
- Set up indexes for optimal performance

## 🔧 Environment Variables

Update your `.env` file with these MySQL settings:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=keystack
DB_USER=root
DB_PASSWORD=your-mysql-password
```

## 📊 Default Data

The installation script includes:

### Admin User

- **Email**: admin@keystack.com
- **Password**: admin123
- **Role**: Admin
- **Status**: Active and verified

## 🔍 Database Structure

### Users Table

```sql
CREATE TABLE `cp_users` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`email` VARCHAR(255) NOT NULL UNIQUE,
`password` VARCHAR(255) NOT NULL,
`first_name` VARCHAR(100) NOT NULL,
`last_name` VARCHAR(100) NOT NULL,
`is_email_verified` BOOLEAN DEFAULT FALSE,
`email_verification_token` VARCHAR(255) NULL,
`role` INT DEFAULT 0,
`state` INT DEFAULT 0,
`last_login` TIMESTAMP NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Groups Table

```sql
CREATE TABLE `cp_groups` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(100) NOT NULL,
`description` TEXT NULL,
`created_by_id` INT NULL,
`is_active` BOOLEAN DEFAULT TRUE,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL
);
```

### Projects Table

```sql
CREATE TABLE `cp_projects` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(100) NOT NULL UNIQUE,
`description` TEXT NULL,
`created_by_id` INT NULL,
`is_active` BOOLEAN DEFAULT TRUE,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL
);
```

### Credentials Table

```sql
CREATE TABLE `cp_credentials` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`label` VARCHAR(200) NOT NULL,
`url` VARCHAR(500) NOT NULL,
`url_pattern` VARCHAR(500) NULL,
`username` VARCHAR(255) NOT NULL,
`password` VARCHAR(500) NOT NULL,
`description` TEXT NULL,
`project_id` INT NULL,
`is_active` BOOLEAN DEFAULT TRUE,
`created_by_id` INT NULL,
`last_used` TIMESTAMP NULL,
`use_count` INT DEFAULT 0,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL,
FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE SET NULL
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
- **Junction Tables**: Optimized many-to-many relationships

## 🛠️ Maintenance

### Backup Database

```bash
mysqldump -u root -p keystack > keystack_backup.sql
```

### Restore Database

```bash
mysql -u root -p keystack < keystack_backup.sql
```

### Reset Database

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS keystack;"
mysql -u root -p < install-001.sql
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
   - Run the installation script first
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