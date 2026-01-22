-- Database initialization script
-- MySQL 5.7+ compatible
-- Optimized for minimal necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  entra_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entra_id (entra_id)
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  table_name VARCHAR(100) NOT NULL UNIQUE,
  total_rows INT DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_dataset_user (created_by),
  INDEX idx_table_name (table_name)
);

-- Query links table
-- Stores condition_columns (JSON array of column names from dataset table)
-- Stores condition_requirements (JSON object mapping column names to required status)
CREATE TABLE IF NOT EXISTS query_links (
  id VARCHAR(36) PRIMARY KEY,
  dataset_id VARCHAR(36) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  condition_columns JSON NOT NULL COMMENT 'Array of column names to use as query conditions',
  condition_requirements JSON COMMENT 'Object mapping column names to required status {columnName: boolean}',
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_links_dataset (dataset_id),
  INDEX idx_links_slug (slug)
);
