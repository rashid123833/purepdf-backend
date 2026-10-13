-- ========================================================
-- PurePDF AI (purepdf.store) Database Schema
-- Target Database: u553556584_purepdf
-- Target User:     u553556584_Rashidpdf
-- Generated for:   purepdf.store (Hostinger cPanel / phpMyAdmin)
-- ========================================================

-- Set character set and collate for international support
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Table structure for `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `plan` ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  `pdf_ops_count` INT NOT NULL DEFAULT 0,
  `ai_queries_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for `history` (User activity logs)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `history`;
CREATE TABLE `history` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `tool_name` VARCHAR(100) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `result_summary` TEXT DEFAULT NULL,
  `download_name` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_history_user_id` (`user_id`),
  KEY `idx_history_created_at` (`created_at`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for `transactions` (Pro plan activations)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 109.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('completed', 'pending', 'failed') NOT NULL DEFAULT 'completed',
  `payment_method` VARCHAR(50) NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_transactions_ref` (`transaction_ref`),
  KEY `idx_transactions_user_id` (`user_id`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table structure for `settings` (Platform configuration)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Seed Data: Platform Settings
-- --------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('freePdfOpsLimit', '3'),
('freeAiQueriesLimit', '5'),
('proPriceInr', '109'),
('announcement', 'Welcome to PurePDF AI (purepdf.store)! 7 PDF tools + Gemini 3.8 Flash intelligence.');

-- --------------------------------------------------------
-- Initial Seed Data: Superadmin & Demo Accounts
-- Passwords:
-- admin@purepdf.store / Rashid@pdf123 (hashed with bcrypt)
-- demo@purepdf.store  / demo123 (hashed with bcrypt)
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `plan`, `pdf_ops_count`, `ai_queries_count`, `created_at`) VALUES
('usr_admin_purepdf', 'Rashid (Admin)', 'admin@purepdf.store', '$2a$10$w4rYxVpt0fQ6dKjGqG40eeW9XQ2mflT/Ym24U9L6U64cKqm8x1W/G', 'admin', 'pro', 12, 45, NOW()),
('usr_demo_purepdf', 'Demo User', 'demo@purepdf.store', '$2a$10$7Z2vA9UoKzV39Oq2G19U8.O1fD4/BfWpL5uPZ8aV1w0eB5tT.b49C', 'user', 'free', 1, 2, NOW());

-- --------------------------------------------------------
-- Initial Sample History and Transaction
-- --------------------------------------------------------
INSERT INTO `history` (`id`, `user_id`, `tool_name`, `file_name`, `file_size`, `result_summary`, `download_name`, `created_at`) VALUES
('hist_seed_001', 'usr_demo_purepdf', 'Compress PDF', 'sample_contract.pdf', 3450210, 'Compressed by 64% (saved 2.2 MB)', 'compressed_sample_contract.pdf', NOW()),
('hist_seed_002', 'usr_demo_purepdf', 'AI Summarizer', 'sample_contract.pdf', 3450210, 'Generated executive summary: 4 milestones, 3 payment terms', NULL, NOW());

INSERT INTO `transactions` (`id`, `user_id`, `user_email`, `amount`, `currency`, `status`, `payment_method`, `transaction_ref`, `created_at`) VALUES
('txn_seed_001', 'usr_admin_purepdf', 'admin@purepdf.store', 109.00, 'INR', 'completed', 'UPI', 'UPI/PUREPDF/20261012/99201', NOW());

SET FOREIGN_KEY_CHECKS = 1;
-- ========================================================
-- End of PurePDF AI Database Initialization Script
-- ========================================================
