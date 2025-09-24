-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 24, 2025 at 08:36 PM
-- Server version: 8.4.1
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `keystack`
--

-- --------------------------------------------------------

--
-- Table structure for table `cp_credentials`
--

CREATE TABLE IF NOT EXISTS `cp_credentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_pattern` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `project_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by_id` int NOT NULL,
  `access_type` enum('individual','group','all') COLLATE utf8mb4_unicode_ci DEFAULT 'individual',
  `last_used` timestamp NULL DEFAULT NULL,
  `use_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_label` (`label`),
  KEY `idx_url` (`url`(255)),
  KEY `idx_created_by_id` (`created_by_id`),
  KEY `idx_access_type` (`access_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_credentials`
--

TRUNCATE TABLE `cp_credentials`;
--
-- Dumping data for table `cp_credentials`
--

INSERT INTO `cp_credentials` (`id`, `label`, `url`, `url_pattern`, `username`, `password`, `description`, `project_id`, `is_active`, `created_by_id`, `access_type`, `last_used`, `use_count`, `created_at`, `updated_at`) VALUES
(1, 'GitHub - Development Team', 'https://github.com', 'github.com/*', 'dev-team@company.com', 'GitHubDev2024!', 'Main GitHub account for development team', 4, 1, 1, 'group', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 20:01:08'),
(2, 'AWS Production Environment', 'https://console.aws.amazon.com', 'console.aws.amazon.com/*', 'aws-admin@company.com', 'AWSProd2024!Secure', 'AWS production environment access', 7, 1, 1, 'individual', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(3, 'Company Slack', 'https://company.slack.com', 'company.slack.com/*', 'team@company.com', 'SlackTeam2024!', 'Main company Slack workspace', 2, 1, 1, 'all', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(4, 'JIRA - Project Management', 'https://company.atlassian.net', 'company.atlassian.net/*', 'pm@company.com', 'JiraPM2024!', 'Project management and issue tracking', 9, 1, 1, 'group', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(5, 'Docker Hub Registry', 'https://hub.docker.com', 'hub.docker.com/*', 'docker-team@company.com', 'DockerHub2024!', 'Container registry access', 4, 1, 1, 'group', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(6, 'Stripe Dashboard', 'https://dashboard.stripe.com', 'dashboard.stripe.com/*', 'payments@company.com', 'StripePay2024!', 'Payment processing dashboard', 6, 1, 1, 'individual', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(7, 'Google Workspace Admin', 'https://admin.google.com', 'admin.google.com/*', 'admin@company.com', 'GoogleAdmin2024!', 'Google Workspace administration', 8, 1, 1, 'individual', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(8, 'Salesforce CRM', 'https://company.salesforce.com', 'company.salesforce.com/*', 'sales@company.com', 'Salesforce2024!', 'Customer relationship management', 10, 1, 1, 'group', NULL, 0, '2025-09-18 17:37:09', '2025-09-19 04:49:44'),
(9, 'Sample cPanel Credential', 'https://distyparts.com/*', 'distyparts.com/backoffice/*', 'izharaazmi.cp', '1234567890', 'Test Chrome Pass', 5, 1, 1, 'group', NULL, 0, '2025-09-19 01:34:27', '2025-09-19 04:49:44'),
(10, 'GitHub - Development', 'https://distyparts.com/*', 'distyparts.com/backoffice/*', 'uhun', 'uniuninini', '', 4, 1, 1, 'individual', NULL, 0, '2025-09-19 16:35:55', '2025-09-19 16:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `cp_credential_groups`
--

CREATE TABLE IF NOT EXISTS `cp_credential_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `credential_id` int NOT NULL,
  `group_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_credential_group` (`credential_id`,`group_id`),
  KEY `idx_credential_id` (`credential_id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_credential_groups`
--

TRUNCATE TABLE `cp_credential_groups`;
--
-- Dumping data for table `cp_credential_groups`
--

INSERT INTO `cp_credential_groups` (`id`, `credential_id`, `group_id`, `created_at`) VALUES
(1, 10, 18, '2025-09-19 18:04:37'),
(2, 10, 17, '2025-09-19 18:04:41'),
(4, 1, 18, '2025-09-19 18:31:37'),
(6, 1, 5, '2025-09-19 19:04:13'),
(8, 2, 5, '2025-09-19 19:51:16'),
(9, 2, 6, '2025-09-21 05:24:53');

-- --------------------------------------------------------

--
-- Table structure for table `cp_credential_users`
--

CREATE TABLE IF NOT EXISTS `cp_credential_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `credential_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_credential_user` (`credential_id`,`user_id`),
  KEY `idx_credential_id` (`credential_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_credential_users`
--

TRUNCATE TABLE `cp_credential_users`;

--
-- Table structure for table `cp_groups`
--

CREATE TABLE IF NOT EXISTS `cp_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_created_by_id` (`created_by_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_groups`
--

TRUNCATE TABLE `cp_groups`;
--
-- Dumping data for table `cp_groups`
--

INSERT INTO `cp_groups` (`id`, `name`, `description`, `created_by_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Development Team', 'Software development team members', 1, 1, '2025-09-18 17:37:09', '2025-09-18 17:37:09'),
(2, 'DevOps Team', 'DevOps and infrastructure team', 1, 0, '2025-09-18 17:37:09', '2025-09-19 05:03:46'),
(3, 'Project Management', 'Project managers and coordinators', 1, 1, '2025-09-18 17:37:09', '2025-09-18 17:37:09'),
(4, 'Sales Team', 'Sales and business development', 1, 1, '2025-09-18 17:37:09', '2025-09-18 17:37:09'),
(5, 'Finance Team', 'Finance and accounting team', 1, 1, '2025-09-18 17:37:09', '2025-09-18 17:37:09'),
(6, 'IT Administration', 'IT administrators and support', 1, 1, '2025-09-18 17:37:09', '2025-09-18 17:37:09'),
(7, 'Test Team', 'This is test team description', 1, 0, '2025-09-18 18:18:11', '2025-09-19 02:11:45'),
(8, 'Test Team', 'This is test team description', 1, 0, '2025-09-18 18:19:49', '2025-09-19 02:11:43'),
(9, 'Test Team', 'This is test team description', 1, 0, '2025-09-18 18:19:50', '2025-09-19 02:11:41'),
(10, 'Team', 'TEst desc', 1, 0, '2025-09-18 18:20:57', '2025-09-19 02:11:39'),
(11, 'Test Team 2', 'Testing team creation', 1, 0, '2025-09-18 18:23:55', '2025-09-19 02:11:36'),
(12, 'Test Team', 'Test team description', 1, 0, '2025-09-19 01:57:41', '2025-09-19 02:11:33'),
(13, 'Development Team', 'Another Development Team', 1, 0, '2025-09-19 02:11:57', '2025-09-19 02:18:09'),
(14, 'Test Team', '', 1, 0, '2025-09-19 02:26:45', '2025-09-19 03:27:26'),
(15, 'Testing Team', '', 1, 0, '2025-09-19 02:26:53', '2025-09-19 03:27:31'),
(16, 'Tester Team', '', 1, 0, '2025-09-19 02:27:13', '2025-09-19 03:27:29'),
(17, 'Project Managers', '', 1, 1, '2025-09-19 02:27:24', '2025-09-19 02:27:24'),
(18, 'Testers Team', 'Testers team description', 1, 1, '2025-09-19 03:27:20', '2025-09-19 03:27:38'),
(19, 'External User', '', 1, 0, '2025-09-19 15:57:25', '2025-09-19 16:02:19');

--
-- Table structure for table `cp_projects`
--

CREATE TABLE IF NOT EXISTS `cp_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_created_by_id` (`created_by_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_projects`
--

TRUNCATE TABLE `cp_projects`;
--
-- Dumping data for table `cp_projects`
--

INSERT INTO `cp_projects` (`id`, `name`, `description`, `created_by_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Test Project', 'A test project', 1, 0, '2025-09-19 02:15:13', '2025-09-19 19:54:52'),
(2, 'Communication', 'Migrated project: Communication', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(3, 'Development', 'Migrated project: Development', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(4, 'DevOps', 'Migrated project: DevOps', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(5, 'Distyparts', 'Migrated project: Distyparts', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(6, 'Finance', 'Migrated project: Finance', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(7, 'Infrastructure', 'Migrated project: Infrastructure', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(8, 'IT Administration', 'Migrated project: IT Administration', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(9, 'Project Management', 'Migrated project: Project Management', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(10, 'Sales', 'Migrated project: Sales', 1, 1, '2025-09-19 04:49:44', '2025-09-19 04:49:44'),
(11, 'Testing Create Priject', 'Test descrition for test create', 1, 1, '2025-09-19 19:49:57', '2025-09-19 19:49:57');

--
-- Table structure for table `cp_project_groups`
--

CREATE TABLE IF NOT EXISTS `cp_project_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `group_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_group` (`project_id`,`group_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_project_groups`
--

TRUNCATE TABLE `cp_project_groups`;
--
-- Dumping data for table `cp_project_groups`
--

INSERT INTO `cp_project_groups` (`id`, `project_id`, `group_id`, `created_at`) VALUES
(2, 8, 3, '2025-09-19 17:46:05'),
(3, 8, 17, '2025-09-19 17:46:05'),
(4, 8, 1, '2025-09-19 17:46:05'),
(12, 11, 4, '2025-09-19 19:50:18'),
(13, 2, 18, '2025-09-19 20:01:36'),
(15, 2, 3, '2025-09-19 20:02:39'),
(16, 3, 6, '2025-09-21 05:24:46');

--
-- Table structure for table `cp_project_users`
--

CREATE TABLE IF NOT EXISTS `cp_project_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_project_user` (`project_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_project_users`
--

TRUNCATE TABLE `cp_project_users`;
--
-- Dumping data for table `cp_project_users`
--

INSERT INTO `cp_project_users` (`id`, `project_id`, `user_id`, `created_at`) VALUES
(2, 8, 5, '2025-09-19 17:46:10'),
(3, 8, 7, '2025-09-19 17:46:10'),
(4, 8, 9, '2025-09-19 17:46:10'),
(5, 8, 3, '2025-09-19 17:46:10'),
(6, 8, 8, '2025-09-19 17:46:10'),
(11, 2, 9, '2025-09-19 18:55:25'),
(12, 2, 1, '2025-09-19 18:55:28'),
(16, 11, 1, '2025-09-19 19:50:15'),
(17, 11, 7, '2025-09-19 19:52:06');

--
-- Table structure for table `cp_schema_version`
--

CREATE TABLE IF NOT EXISTS `cp_schema_version` (
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_schema_version`
--

TRUNCATE TABLE `cp_schema_version`;
--
-- Dumping data for table `cp_schema_version`
--

INSERT INTO `cp_schema_version` (`version`, `applied_at`, `description`) VALUES
('1.0.1', '2025-09-19 02:01:16', 'Add projects table and migrate credentials to use project_id foreign key');

--
-- Table structure for table `cp_users`
--

CREATE TABLE IF NOT EXISTS `cp_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_email_verified` tinyint(1) DEFAULT '0',
  `email_verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` int DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_state` (`state`),
  KEY `idx_role` (`role`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_users`
--

TRUNCATE TABLE `cp_users`;
--
-- Dumping data for table `cp_users`
--

INSERT INTO `cp_users` (`id`, `email`, `password`, `first_name`, `last_name`, `is_email_verified`, `email_verification_token`, `state`, `last_login`, `created_at`, `updated_at`, `role`) VALUES
(1, 'izhar@codeacious.tech', '$2a$12$olBwEPGPw7NEDv9OgHUrseoX79ZBK5hu1ZQce9A/6vO/dCGr1elT.', 'Izhar', 'Aazmi', 1, NULL, 1, '2025-09-24 17:40:50', '2025-09-18 17:37:09', '2025-09-24 17:40:50', 1),
(2, 'john.doe@company.com', '$2a$12$c0eptKHtO8T83vn6NJNmFeHXSnoJdKs6kpUIs7PFE2Uu25NFG5xK2', 'John', 'Doe', 1, NULL, -2, NULL, '2025-09-18 17:37:09', '2025-09-19 07:02:12', 1),
(3, 'jane.smith@company.com', '$2a$12$6V5dBg0GnqBK4KkfmQOLIeHEUDl6/Fcoo/R58YaJ6CRezoDab98Ki', 'Jane', 'Smith', 1, NULL, 1, NULL, '2025-09-18 17:37:09', '2025-09-21 05:08:41', 0),
(4, 'mike.johnson@company.com', '$2a$12$/4IRld4WZbUXsDsu4BLVWu6ayr9DG24vrcnqmAcBq2YwSyieqnE26', 'Mike', 'Johnson', 1, NULL, 0, NULL, '2025-09-18 17:37:09', '2025-09-18 18:20:38', 0),
(5, 'sarah.wilson@company.com', '$2a$12$8K9mN2pQ5rT7vXwYzA1bCdEfGhIjKlMnOpQrStUvWxYzA1bCdEfGh', 'Sarah', 'Wilson', 1, NULL, 0, NULL, '2025-09-18 17:37:09', '2025-09-18 18:20:40', 0),
(6, 'david.brown@company.com', '$2a$12$9L0nO3qR6sU8wXzYbB2cDeFgHiJkLmNoPrStVwXzYbB2cDeFgHiJk', 'David', 'Brown', 1, NULL, 0, NULL, '2025-09-18 17:37:09', '2025-09-18 18:20:40', 0),
(7, 'test@example.com', '$2a$12$iuXRBX1iiqu4ztbIqlMp5.bJgBdKvupBl8.ET24FCTIp5/GWOURZO', 'Test', 'User', 0, '9435a933a9e1323ddfa9ed5feadea4ea390cb0d9c913c2fc184829058d8b5899', 0, NULL, '2025-09-18 17:58:30', '2025-09-19 06:20:50', 0),
(8, 'zafar.nayab@gmail.com', '$2a$12$trsPznmmqkDkaiarUYTZpeMcI40Dn.RcH3frPMro0kG7UXOPMSN96', 'Zafar', 'Nayab', 0, 'a42afd9501639922566636b15e08e7322dc7b3515a87c0100f8749dd4ebcf258', 1, NULL, '2025-09-18 18:14:20', '2025-09-21 05:08:29', 0),
(9, 'zafar.nayab23@gmail.com', '$2a$12$Q74JiH4/j2wnUWZqS8wYmO/4nbsG1Pxl5Wg1Orraa2JzljjEyDI.W', 'Zafar', 'Nayab', 0, 'a6f96106f967a7500420e8b566e0cf4082b96242f071a6111963d3f82058ea1c', -1, NULL, '2025-09-18 18:17:24', '2025-09-19 14:51:42', 0);

--
-- Table structure for table `cp_user_groups`
--

CREATE TABLE IF NOT EXISTS `cp_user_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_group` (`user_id`,`group_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Truncate table before insert `cp_user_groups`
--

TRUNCATE TABLE `cp_user_groups`;
--
-- Dumping data for table `cp_user_groups`
--

INSERT INTO `cp_user_groups` (`id`, `user_id`, `group_id`, `created_at`) VALUES
(1, 9, 3, '2025-09-24 17:42:09'),
(2, 8, 3, '2025-09-24 17:42:09'),
(3, 1, 6, '2025-09-24 17:42:18'),
(4, 4, 6, '2025-09-24 17:42:18');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cp_credentials`
--
ALTER TABLE `cp_credentials`
  ADD CONSTRAINT `cp_credentials_ibfk_1` FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_credentials_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `cp_credentials_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cp_credential_groups`
--
ALTER TABLE `cp_credential_groups`
  ADD CONSTRAINT `cp_credential_groups_ibfk_1` FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_credential_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cp_credential_users`
--
ALTER TABLE `cp_credential_users`
  ADD CONSTRAINT `cp_credential_users_ibfk_1` FOREIGN KEY (`credential_id`) REFERENCES `cp_credentials` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_credential_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cp_groups`
--
ALTER TABLE `cp_groups`
  ADD CONSTRAINT `cp_groups_ibfk_1` FOREIGN KEY (`created_by_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cp_project_groups`
--
ALTER TABLE `cp_project_groups`
  ADD CONSTRAINT `cp_project_groups_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_project_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cp_project_users`
--
ALTER TABLE `cp_project_users`
  ADD CONSTRAINT `cp_project_users_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `cp_projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_project_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cp_user_groups`
--
ALTER TABLE `cp_user_groups`
  ADD CONSTRAINT `cp_user_groups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `cp_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cp_user_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `cp_groups` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
