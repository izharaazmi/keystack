-- Migration: Add projects table and update credentials table
-- Version: 1.0.1
-- Description: Add cp_projects table and migrate credentials to use project_id foreign key

-- Create projects table
CREATE TABLE IF NOT EXISTS `cp_projects`
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

-- Check if project_id column exists, if not add it
SET @column_exists = (SELECT COUNT(*)
                      FROM INFORMATION_SCHEMA.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'cp_credentials'
                        AND COLUMN_NAME = 'project_id');

SET @sql = IF(@column_exists = 0,
              'ALTER TABLE `cp_credentials` ADD COLUMN `project_id` INT NULL AFTER `description`',
              'SELECT "Column project_id already exists" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for project_id if it doesn't exist
SET @index_exists = (SELECT COUNT(*)
                     FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = DATABASE()
                       AND TABLE_NAME = 'cp_credentials'
                       AND INDEX_NAME = 'idx_project_id');

SET @sql = IF(@index_exists = 0,
              'ALTER TABLE `cp_credentials` ADD INDEX `idx_project_id` (`project_id`)',
              'SELECT "Index idx_project_id already exists" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for project_id if it doesn't exist
SET @fk_exists = (SELECT COUNT(*)
                  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'cp_credentials'
                    AND COLUMN_NAME = 'project_id'
                    AND REFERENCED_TABLE_NAME = 'cp_projects');

SET @sql = IF(@fk_exists = 0,
              'ALTER TABLE `cp_credentials` ADD FOREIGN KEY (`project_id`) REFERENCES `cp_projects`(`id`) ON DELETE SET NULL',
              'SELECT "Foreign key for project_id already exists" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing project data (only if project column exists)
SET @project_column_exists = (SELECT COUNT(*)
                              FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE()
                                AND TABLE_NAME = 'cp_credentials'
                                AND COLUMN_NAME = 'project');

SET @sql = IF(@project_column_exists > 0,
              'INSERT INTO `cp_projects` (`name`, `description`, `created_by_id`, `is_active`)
               SELECT DISTINCT
                   `project` as `name`,
                   CONCAT("Migrated project: ", `project`) as `description`,
                   MIN(`created_by_id`) as `created_by_id`,
                   TRUE as `is_active`
               FROM `cp_credentials`
               WHERE `project` IS NOT NULL AND `project` != ""
               GROUP BY `project`',
              'SELECT "No project column found, skipping migration" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update credentials to use project_id (only if project column exists)
SET @sql = IF(@project_column_exists > 0,
              'UPDATE `cp_credentials` c
               JOIN `cp_projects` p ON c.project = p.name
               SET c.project_id = p.id',
              'SELECT "No project column found, skipping update" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update foreign key constraints to use SET NULL for created_by_id (safely)
-- Check if groups table exists and has created_by_id column
SET @groups_table_exists = (SELECT COUNT(*)
                            FROM INFORMATION_SCHEMA.TABLES
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'cp_groups');

SET @groups_created_by_exists = (SELECT COUNT(*)
                                 FROM INFORMATION_SCHEMA.COLUMNS
                                 WHERE TABLE_SCHEMA = DATABASE()
                                   AND TABLE_NAME = 'cp_groups'
                                   AND COLUMN_NAME = 'created_by_id');

-- Update groups table if it exists
SET @sql = IF(@groups_table_exists > 0 AND @groups_created_by_exists > 0,
              'ALTER TABLE `cp_groups` MODIFY COLUMN `created_by_id` INT NULL',
              'SELECT "Groups table or created_by_id column not found" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update credentials table created_by_id
SET @credentials_created_by_exists = (SELECT COUNT(*)
                                      FROM INFORMATION_SCHEMA.COLUMNS
                                      WHERE TABLE_SCHEMA = DATABASE()
                                        AND TABLE_NAME = 'cp_credentials'
                                        AND COLUMN_NAME = 'created_by_id');

SET @sql = IF(@credentials_created_by_exists > 0,
              'ALTER TABLE `cp_credentials` MODIFY COLUMN `created_by_id` INT NULL',
              'SELECT "Credentials created_by_id column not found" as message'
    );
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create schema version table if it doesn't exist
CREATE TABLE IF NOT EXISTS `cp_schema_version`
(
    `version`     VARCHAR(20) PRIMARY KEY,
    `applied_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `description` TEXT
);

-- Record this migration
INSERT IGNORE INTO `cp_schema_version` (`version`, `description`)
VALUES ('1.0.1', 'Add projects table and migrate credentials to use project_id foreign key');
