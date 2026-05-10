CREATE DATABASE IF NOT EXISTS traveloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE traveloop;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clerk_id      VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  avatar_url    TEXT,
  bio           TEXT,
  language      VARCHAR(10) NOT NULL DEFAULT 'en',
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clerk_id (clerk_id)
);

CREATE TABLE IF NOT EXISTS cities (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  country         VARCHAR(255) NOT NULL,
  region          ENUM('Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East') NOT NULL,
  cost_index      TINYINT NOT NULL CHECK (cost_index BETWEEN 1 AND 3),
  popularity_score DECIMAL(3,1) DEFAULT 0.0,
  image_url       TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_country (country),
  INDEX idx_region (region)
);

CREATE TABLE IF NOT EXISTS trips (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  cover_photo   TEXT,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        ENUM('upcoming', 'ongoing', 'completed') NOT NULL DEFAULT 'upcoming',
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  share_token   VARCHAR(64) UNIQUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_share_token (share_token)
);

CREATE TABLE IF NOT EXISTS stops (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  trip_id       INT NOT NULL,
  city_id       INT NOT NULL,
  stop_order    INT NOT NULL DEFAULT 0,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT,
  INDEX idx_trip_id (trip_id),
  UNIQUE KEY unique_stop (trip_id, city_id)
);

CREATE TABLE IF NOT EXISTS activities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  stop_id           INT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  category          ENUM('sightseeing', 'food', 'adventure', 'shopping', 'culture') NOT NULL,
  description       TEXT,
  cost              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_minutes  INT,
  time_slot         VARCHAR(50),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
  INDEX idx_stop_id (stop_id),
  INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS activity_catalog (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  city_id           INT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  category          ENUM('sightseeing', 'food', 'adventure', 'shopping', 'culture') NOT NULL,
  description       TEXT,
  avg_cost          DECIMAL(10,2),
  duration_minutes  INT,
  image_url         TEXT,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
  INDEX idx_city_id (city_id),
  INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS budget_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  trip_id       INT NOT NULL,
  category      ENUM('transport', 'accommodation', 'activities', 'meals', 'misc') NOT NULL,
  description   VARCHAR(255) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1,
  unit_cost     DECIMAL(10,2) NOT NULL,
  total         DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_trip_id (trip_id)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  trip_id       INT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  category      ENUM('clothing', 'documents', 'electronics', 'toiletries', 'other') NOT NULL DEFAULT 'other',
  is_packed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_trip_id (trip_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  trip_id       INT NOT NULL,
  stop_id       INT,
  content       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE SET NULL,
  INDEX idx_trip_id (trip_id)
);

CREATE TABLE IF NOT EXISTS community_likes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  trip_id       INT NOT NULL,
  user_id       INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS trip_copies (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  original_trip_id  INT NOT NULL,
  copied_by_user_id INT NOT NULL,
  new_trip_id       INT NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (original_trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (copied_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (new_trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_destinations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  city_id       INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_save (user_id, city_id)
);
