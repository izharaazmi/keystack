-- KeyStack Database Installation Script
-- Version: 1.0.0 (First Release)
-- MySQL 8.0+ Compatible

-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE keystack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE keystack;

-- Drop tables if they exist (for clean initialization)
-- Drop in reverse order to handle foreign key constraints
DROP TABLE IF EXISTS `cp_credential_groups`;
DROP TABLE IF EXISTS `cp_credential_users`;
DROP TABLE IF EXISTS `cp_project_groups`;
DROP TABLE IF EXISTS `cp_project_users`;
DROP TABLE IF EXISTS `cp_credentials`;
DROP TABLE IF EXISTS `cp_projects`;
DROP TABLE IF EXISTS `cp_groups`;
DROP TABLE IF EXISTS `cp_users`;
DROP TABLE IF EXISTS `cp_schema_version`;

-- Schema version tracking table
CREATE TABLE `cp_schema_version` (
`version` VARCHAR(20) PRIMARY KEY,
`applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`description` TEXT
);

-- Users table
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
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX `idx_email` (`email`),
INDEX `idx_role` (`role`),
INDEX `idx_state` (`state`),
INDEX `idx_created_at` (`created_at`)
);

-- Groups table
CREATE TABLE `cp_groups` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(100) NOT NULL,
`description` TEXT NULL,
`created_by_id` INT NULL,
`is_active` BOOLEAN DEFAULT TRUE,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL,
INDEX `idx_name` (`name`),
INDEX `idx_created_by_id` (`created_by_id`),
INDEX `idx_is_active` (`is_active`),
INDEX `idx_created_at` (`created_at`)
);

-- Projects table
CREATE TABLE `cp_projects` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`name` VARCHAR(100) NOT NULL UNIQUE,
`description` TEXT NULL,
`created_by_id` INT NULL,
`is_active` BOOLEAN DEFAULT TRUE,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL,
INDEX `idx_name` (`name`),
INDEX `idx_created_by_id` (`created_by_id`),
INDEX `idx_is_active` (`is_active`),
INDEX `idx_created_at` (`created_at`)
);

-- Credentials table
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
FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE SET NULL,
INDEX `idx_label` (`label`),
INDEX `idx_url` (`url`(255)),
INDEX `idx_created_by_id` (`created_by_id`),
INDEX `idx_is_active` (`is_active`),
INDEX `idx_project_id` (`project_id`),
INDEX `idx_created_at` (`created_at`)
);

-- User-Group junction table
CREATE TABLE `cp_user_groups` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`user_id` INT NOT NULL,
`group_id` INT NOT NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE,
UNIQUE KEY `unique_user_group` (`user_id`, `group_id`),
INDEX `idx_user_id` (`user_id`),
INDEX `idx_group_id` (`group_id`)
);

-- Project-User junction table
CREATE TABLE `cp_project_users` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`project_id` INT NOT NULL,
`user_id` INT NOT NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE CASCADE,
FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
UNIQUE KEY `unique_project_user` (`project_id`, `user_id`),
INDEX `idx_project_id` (`project_id`),
INDEX `idx_user_id` (`user_id`)
);

-- Project-Group junction table
CREATE TABLE `cp_project_groups` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`project_id` INT NOT NULL,
`group_id` INT NOT NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE CASCADE,
FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE,
UNIQUE KEY `unique_project_group` (`project_id`, `group_id`),
INDEX `idx_project_id` (`project_id`),
INDEX `idx_group_id` (`group_id`)
);

-- Credential-User junction table
CREATE TABLE `cp_credential_users` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`credential_id` INT NOT NULL,
`user_id` INT NOT NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
UNIQUE KEY `unique_credential_user` (`credential_id`, `user_id`),
INDEX `idx_credential_id` (`credential_id`),
INDEX `idx_user_id` (`user_id`)
);

-- Credential-Group junction table
CREATE TABLE `cp_credential_groups` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`credential_id` INT NOT NULL,
`group_id` INT NOT NULL,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE,
UNIQUE KEY `unique_credential_group` (`credential_id`, `group_id`),
INDEX `idx_credential_id` (`credential_id`),
INDEX `idx_group_id` (`group_id`)
);

-- Insert only essential admin user (no sample data)
INSERT INTO `cp_users` (`email`, `password`, `first_name`, `last_name`, `is_email_verified`, `role`, `state`)
VALUES ('admin@keystack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', 'Admin', 'User', TRUE, 1, 1);

-- Record this installation
INSERT INTO `cp_schema_version` (`version`, `description`)
VALUES ('1.0.0', 'Initial database installation - First release');

-- Installation completed
SELECT 'KeyStack database installation completed successfully!' as status;
