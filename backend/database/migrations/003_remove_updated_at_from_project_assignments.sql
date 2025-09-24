-- Remove updated_at columns from project assignment tables
-- Migration: 003_remove_updated_at_from_project_assignments.sql
-- Description: Remove unused updated_at columns from cp_project_users and cp_project_groups tables

-- Remove updated_at column from cp_project_users table
ALTER TABLE `cp_project_users` DROP COLUMN `updated_at`;

-- Remove updated_at column from cp_project_groups table  
ALTER TABLE `cp_project_groups` DROP COLUMN `updated_at`;
