DROP DATABASE IF EXISTS elapor_prambanan;
CREATE DATABASE elapor_prambanan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elapor_prambanan;

CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  nik VARCHAR(16) NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  role ENUM('PELAPOR', 'OFFICER') NOT NULL DEFAULT 'PELAPOR',
  badge_number VARCHAR(20) NULL UNIQUE,
  unit_name VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  icon_code VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reports (
  report_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  priority_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  incident_location VARCHAR(150) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  image_url TEXT NULL,
  status ENUM('PENDING', 'IN_PROGRESS', 'SOLVED', 'TRANSFERRED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  out_of_jurisdiction BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_responses (
  response_id VARCHAR(36) PRIMARY KEY,
  report_id VARCHAR(36) NOT NULL,
  officer_id VARCHAR(36) NOT NULL,
  action_taken TEXT NOT NULL,
  response_notes TEXT NULL,
  proof_image_url TEXT NULL,
  updated_status ENUM('PENDING', 'IN_PROGRESS', 'SOLVED', 'TRANSFERRED', 'REJECTED') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_responses_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_officer FOREIGN KEY (officer_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
