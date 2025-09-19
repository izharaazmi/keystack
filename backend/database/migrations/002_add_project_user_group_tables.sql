-- Add Project-User and Project-Group junction tables
-- Migration: 002_add_project_user_group_tables.sql

-- Create Project-User junction table
CREATE TABLE `cp_project_users` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `projectId` INT NOT NULL,
    `userId` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`projectId`) REFERENCES `cp_projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`userId`) REFERENCES `cp_users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_project_user` (`projectId`, `userId`),
    INDEX `idx_project_id` (`projectId`),
    INDEX `idx_user_id` (`userId`)
);

-- Create Project-Group junction table
CREATE TABLE `cp_project_groups` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `projectId` INT NOT NULL,
    `groupId` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`projectId`) REFERENCES `cp_projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`groupId`) REFERENCES `cp_groups`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_project_group` (`projectId`, `groupId`),
    INDEX `idx_project_id` (`projectId`),
    INDEX `idx_group_id` (`groupId`)
);
