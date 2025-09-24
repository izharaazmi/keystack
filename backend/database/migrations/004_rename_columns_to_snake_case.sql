-- Rename columns from camelCase to snake_case
-- Migration: 004_rename_columns_to_snake_case.sql
-- Description: Rename columns in project assignment tables to use snake_case convention

-- Rename columns in cp_project_users table
ALTER TABLE `cp_project_users` 
  CHANGE COLUMN `projectId` `project_id` INT NOT NULL,
  CHANGE COLUMN `userId` `user_id` INT NOT NULL;

-- Rename columns in cp_project_groups table
ALTER TABLE `cp_project_groups` 
  CHANGE COLUMN `projectId` `project_id` INT NOT NULL,
  CHANGE COLUMN `groupId` `group_id` INT NOT NULL;
