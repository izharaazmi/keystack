# Etc Folder

This folder contains administrative, utility, and generated files that are not part of the core project but are needed for development and maintenance.

## Contents

### Database Management
- `setup.js` - Database initialization script
- `migrate.js` - Database migration runner
- `run_migration_003.js` - Specific migration script

### Scripts
- `createAdmin.js` - Creates initial admin user
- `createTestUsers.js` - Creates test users for development
- `seedCredentials.js` - Seeds sample credentials and groups

### Build Artifacts
- `build/` - Compiled frontend build files (can be regenerated with `npm run build`)

### Dependencies
- `node_modules/` - Node.js dependencies (can be regenerated with `npm install`)
- `package-lock.json` - Lock file for dependencies (can be regenerated)

## Usage

These files are moved here to keep the main project structure clean while preserving important administrative tools and generated files.

To restore any of these files to their original locations:
- Scripts: Move back to `backend/src/scripts/`
- Database tools: Move back to `backend/database/`
- Build artifacts: Regenerate with `npm run build` in admin-frontend
- Dependencies: Regenerate with `npm install`
