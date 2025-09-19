# Chrome Pass - Development Utilities

This folder contains development utilities, one-off scripts, and files that were used during the development process but are no longer needed for the main application.

## 📁 Contents

### Backend Utilities (`/backend/`)
Development and debugging scripts for the backend API:

- **`check-admin.js`** - Check admin user status and password validation
- **`check-tables.js`** - Check database tables and their contents
- **`check-teams.js`** - Check teams/groups in the database
- **`create-missing-tables.js`** - Create missing database tables
- **`create-test-token.js`** - Generate JWT test tokens
- **`fix-admin-password.js`** - Fix admin password issues
- **`reset-admin-password.js`** - Reset admin password
- **`test-migration.js`** - Test migration results
- **`database.sqlite`** - Unused SQLite database file (project uses MySQL)
- **`database/simple-migrate.js`** - Simple migration script (superseded by proper migration system)

### Chrome Extension Utilities (`/chrome-extension/icons/`)
Icon generation scripts that were used to create the extension icons:

- **`convert-to-png.js`** - Convert HTML icons to PNG format
- **`create-basic-icons.js`** - Create basic PNG icons
- **`create-png-icons.js`** - Create PNG icons
- **`create-simple-icons.js`** - Create simple icons
- **`generate-icons.js`** - Main icon generation script

### Documentation (`/`)
- **`DEFAULT_CREDENTIALS.txt`** - Sample credentials and setup instructions

## 🎯 Purpose

These files were created for specific development tasks:

### Backend Scripts
- **Database Setup**: One-time scripts for initial database setup
- **Debugging**: Scripts to check database status and user accounts
- **Migration Testing**: Scripts to test database migrations
- **Password Management**: Scripts to fix or reset admin passwords
- **Token Generation**: Scripts to create test JWT tokens

### Icon Generation
- **Asset Creation**: Scripts to generate Chrome extension icons
- **Format Conversion**: Tools to convert between different icon formats
- **Batch Processing**: Scripts to create multiple icon sizes

### Documentation
- **Setup Guide**: Sample credentials and setup instructions
- **Reference Material**: Development reference documents

## ⚠️ Important Notes

### These Files Are NOT Used By The Application
- None of these files are imported or referenced by the main application
- They are not included in the production build
- They are not required for the application to function

### When You Might Need Them
- **Database Issues**: If you need to debug database problems
- **Password Reset**: If you need to reset admin passwords
- **Icon Updates**: If you need to regenerate extension icons
- **Development**: If you're extending the application

## 🚀 Usage

### Backend Scripts
```bash
# Navigate to backend directory
cd backend

# Run any of the utility scripts
node check-admin.js
node check-tables.js
node create-test-token.js
# ... etc
```

### Icon Generation
```bash
# Navigate to icons directory
cd chrome-extension/icons

# Run icon generation scripts
node generate-icons.js
node create-png-icons.js
# ... etc
```

## 🗑️ Safe to Delete

These files can be safely deleted if:
- You don't need to debug the application
- You don't plan to modify the extension icons
- You don't need the sample credentials
- You want to reduce repository size

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend setup and usage
- [Frontend README](../admin-frontend/README.md) - Frontend setup and usage
- [Extension README](../chrome-extension/README.md) - Extension setup and usage

## 🔄 Moving Files Back

If you need to use any of these files:

1. **Copy the file** from `.extras/` to its original location
2. **Run the script** as needed
3. **Move it back** to `.extras/` when done

Example:
```bash
# Copy a script back to backend
cp .extras/backend/check-admin.js backend/

# Run the script
cd backend && node check-admin.js

# Move it back when done
mv backend/check-admin.js .extras/backend/
```

## 📞 Support

If you need help with any of these utilities:
1. Check the individual file comments
2. Review the main component READMEs
3. Check the git history for usage examples
4. Create an issue in the repository

---

**Note**: These files are kept for reference and potential future use, but they are not part of the main application functionality.
