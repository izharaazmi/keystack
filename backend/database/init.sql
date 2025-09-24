-- KeyStack Database Initialization Script
-- MySQL 8.0+ Compatible

-- Create database (run this first if database doesn't exist)
-- CREATE DATABASE keystack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE keystack;

-- Drop tables if they exist (for clean initialization)
-- Drop in reverse order to handle foreign key constraints
DROP TABLE IF EXISTS `cp_credential_groups`;
DROP TABLE IF EXISTS `cp_credential_users`;
DROP TABLE IF EXISTS `cp_user_groups`;
DROP TABLE IF EXISTS `cp_credentials`;
DROP TABLE IF EXISTS `cp_projects`;
DROP TABLE IF EXISTS `cp_groups`;
DROP TABLE IF EXISTS `cp_users`;

-- Users table
CREATE TABLE `cp_users`
(
    `id`                       INT PRIMARY KEY AUTO_INCREMENT,
    `email`                    VARCHAR(255) NOT NULL UNIQUE,
    `password`                 VARCHAR(255) NOT NULL,
    `first_name`               VARCHAR(100) NOT NULL,
    `last_name`                VARCHAR(100) NOT NULL,
    `is_email_verified`        BOOLEAN                DEFAULT FALSE,
    `email_verification_token` VARCHAR(255) NULL,
    `role`                     ENUM ('admin', 'user') DEFAULT 'user',
    `is_active`                BOOLEAN                DEFAULT TRUE,
    `last_login`               TIMESTAMP    NULL,
    `created_at`               TIMESTAMP              DEFAULT CURRENT_TIMESTAMP,
    `updated_at`               TIMESTAMP              DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_email` (`email`),
    INDEX `idx_role` (`role`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_created_at` (`created_at`)
);

-- Groups table
CREATE TABLE `cp_groups`
(
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `name`          VARCHAR(100) NOT NULL,
    `description`   TEXT         NULL,
    `created_by_id` INT          NULL,
    `is_active`     BOOLEAN   DEFAULT TRUE,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL,
    INDEX `idx_name` (`name`),
    INDEX `idx_created_by_id` (`created_by_id`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_created_at` (`created_at`)
);

-- Projects table
CREATE TABLE `cp_projects`
(
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `name`          VARCHAR(100) NOT NULL UNIQUE,
    `description`   TEXT         NULL,
    `created_by_id` INT          NULL,
    `is_active`     BOOLEAN   DEFAULT TRUE,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE SET NULL,
    INDEX `idx_name` (`name`),
    INDEX `idx_created_by_id` (`created_by_id`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_created_at` (`created_at`)
);

-- Credentials table
CREATE TABLE `cp_credentials`
(
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `label`         VARCHAR(200) NOT NULL,
    `url`           VARCHAR(500) NOT NULL,
    `url_pattern`   VARCHAR(500) NULL,
    `username`      VARCHAR(255) NOT NULL,
    `password`      VARCHAR(500) NOT NULL,
    `description`   TEXT         NULL,
    `project_id`    INT          NULL,
    `is_active`     BOOLEAN   DEFAULT TRUE,
    `created_by_id` INT          NULL,
    `last_used`     TIMESTAMP    NULL,
    `use_count`     INT       DEFAULT 0,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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
CREATE TABLE `cp_user_groups`
(
    `id`         INT PRIMARY KEY AUTO_INCREMENT,
    `user_id`    INT NOT NULL,
    `group_id`   INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_group` (`user_id`, `group_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_group_id` (`group_id`)
);

-- Credential-User junction table
CREATE TABLE `cp_credential_users`
(
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `credential_id` INT NOT NULL,
    `user_id`       INT NOT NULL,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_credential_user` (`credential_id`, `user_id`),
    INDEX `idx_credential_id` (`credential_id`),
    INDEX `idx_user_id` (`user_id`)
);

-- Credential-Group junction table
CREATE TABLE `cp_credential_groups`
(
    `id`            INT PRIMARY KEY AUTO_INCREMENT,
    `credential_id` INT NOT NULL,
    `group_id`      INT NOT NULL,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_credential_group` (`credential_id`, `group_id`),
    INDEX `idx_credential_id` (`credential_id`),
    INDEX `idx_group_id` (`group_id`)
);

-- Insert default admin user
INSERT INTO `cp_users` (`email`, `password`, `first_name`, `last_name`, `is_email_verified`, `role`, `is_active`)
VALUES ('admin@keystack.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', -- 'admin123' hashed
        'Admin',
        'User',
        TRUE,
        'admin',
        TRUE);

-- Insert sample users
INSERT INTO `cp_users` (`email`, `password`, `first_name`, `last_name`, `is_email_verified`, `role`, `is_active`)
VALUES ('john.doe@company.com', '$2a$12$c0eptKHtO8T83vn6NJNmFeHXSnoJdKs6kpUIs7PFE2Uu25NFG5xK2', 'John', 'Doe', TRUE, 'user', TRUE),
       ('jane.smith@company.com', '$2a$12$6V5dBg0GnqBK4KkfmQOLIeHEUDl6/Fcoo/R58YaJ6CRezoDab98Ki', 'Jane', 'Smith', TRUE, 'user', TRUE),
       ('mike.johnson@company.com', '$2a$12$/4IRld4WZbUXsDsu4BLVWu6ayr9DG24vrcnqmAcBq2YwSyieqnE26', 'Mike', 'Johnson', TRUE, 'user', TRUE),
       ('sarah.wilson@company.com', '$2a$12$8K9mN2pQ5rT7vXwYzA1bCdEfGhIjKlMnOpQrStUvWxYzA1bCdEfGh', 'Sarah', 'Wilson', TRUE, 'user', TRUE),
       ('david.brown@company.com', '$2a$12$9L0nO3qR6sU8wXzYbB2cDeFgHiJkLmNoPrStVwXzYbB2cDeFgHiJk', 'David', 'Brown', TRUE, 'user', TRUE);

-- Insert sample groups
INSERT INTO `cp_groups` (`name`, `description`, `created_by_id`, `is_active`)
VALUES ('Development Team', 'Software development team members', 1, TRUE),
       ('DevOps Team', 'DevOps and infrastructure team', 1, TRUE),
       ('Project Management', 'Project managers and coordinators', 1, TRUE),
       ('Sales Team', 'Sales and business development', 1, TRUE),
       ('Finance Team', 'Finance and accounting team', 1, TRUE),
       ('IT Administration', 'IT administrators and support', 1, TRUE);

-- Insert sample projects
INSERT INTO `cp_projects` (`name`, `description`, `created_by_id`, `is_active`)
VALUES ('Development', 'Software development and coding projects', 1, TRUE),
       ('Infrastructure', 'Infrastructure and DevOps projects', 1, TRUE),
       ('Communication', 'Internal and external communication tools', 1, TRUE),
       ('Project Management', 'Project tracking and management tools', 1, TRUE),
       ('DevOps', 'Development operations and deployment', 1, TRUE),
       ('Finance', 'Financial and payment processing systems', 1, TRUE),
       ('IT Administration', 'IT administration and system management', 1, TRUE),
       ('Sales', 'Sales and customer relationship management', 1, TRUE);

-- Insert sample credentials
INSERT INTO `cp_credentials` (`label`, `url`, `url_pattern`, `username`, `password`, `description`, `project_id`, `created_by_id`, `is_active`)
VALUES ('GitHub - Development Team', 'https://github.com', 'github.com/*', 'dev-team@company.com', 'GitHubDev2024!',
        'Main GitHub account for development team', 1, 1, TRUE),
       ('AWS Production Environment', 'https://console.aws.amazon.com', 'console.aws.amazon.com/*', 'aws-admin@company.com', 'AWSProd2024!Secure',
        'AWS production environment access', 2, 1, TRUE),
       ('Company Slack', 'https://company.slack.com', 'company.slack.com/*', 'team@company.com', 'SlackTeam2024!', 'Main company Slack workspace', 3,
        1, TRUE),
       ('JIRA - Project Management', 'https://company.atlassian.net', 'company.atlassian.net/*', 'pm@company.com', 'JiraPM2024!',
        'Project management and issue tracking', 4, 1, TRUE),
       ('Docker Hub Registry', 'https://hub.docker.com', 'hub.docker.com/*', 'docker-team@company.com', 'DockerHub2024!', 'Container registry access',
        5, 1, TRUE),
       ('Stripe Dashboard', 'https://dashboard.stripe.com', 'dashboard.stripe.com/*', 'payments@company.com', 'StripePay2024!',
        'Payment processing dashboard', 6, 1, TRUE),
       ('Google Workspace Admin', 'https://admin.google.com', 'admin.google.com/*', 'admin@company.com', 'GoogleAdmin2024!',
        'Google Workspace administration', 7, 1, TRUE),
       ('Salesforce CRM', 'https://company.salesforce.com', 'company.salesforce.com/*', 'sales@company.com', 'Salesforce2024!',
        'Customer relationship management', 8, 1, TRUE);

-- Assign users to groups
INSERT INTO `cp_user_groups` (`user_id`, `group_id`)
VALUES (2, 1), -- John Doe -> Development Team
       (3, 1), -- Jane Smith -> Development Team
       (4, 2), -- Mike Johnson -> DevOps Team
       (5, 3), -- Sarah Wilson -> Project Management
       (6, 4);
-- David Brown -> Sales Team

-- Assign credentials to groups
INSERT INTO `cp_credential_groups` (`credential_id`, `group_id`)
VALUES (1, 1), -- GitHub -> Development Team
       (4, 3), -- JIRA -> Project Management
       (5, 2), -- Docker Hub -> DevOps Team
       (8, 4);
-- Salesforce -> Sales Team

-- Assign credentials to individual users
INSERT INTO `cp_credential_users` (`credential_id`, `user_id`)
VALUES (2, 1), -- AWS -> Admin
       (6, 1), -- Stripe -> Admin
       (7, 1);
-- Google Workspace -> Admin

-- Note: Views will be created separately to avoid SQL parsing issues

-- Show table creation summary
SELECT 'Database initialization completed successfully!' as status;
SELECT COUNT(*) as `total_users`
FROM `cp_users`;
SELECT COUNT(*) as `total_groups`
FROM `cp_groups`;
SELECT COUNT(*) as `total_projects`
FROM `cp_projects`;
SELECT COUNT(*) as `total_credentials`
FROM `cp_credentials`;
SELECT COUNT(*) as `total_user_groups`
FROM `cp_user_groups`;
SELECT COUNT(*) as `total_credential_users`
FROM `cp_credential_users`;
SELECT COUNT(*) as `total_credential_groups`
FROM `cp_credential_groups`;
