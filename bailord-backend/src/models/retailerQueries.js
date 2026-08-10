// Create retailers table query
export const CREATE_RETAILERS_TABLE = `
  CREATE TABLE IF NOT EXISTS retailers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    business_name VARCHAR(255) NOT NULL,
    business_type ENUM('Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Health & Beauty', 'Other') NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT DEFAULT NULL UNIQUE,
    INDEX idx_email (email),
    INDEX idx_city (city),
    INDEX idx_business_type (business_type),
    INDEX idx_status (status),
    CONSTRAINT fk_retailers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Insert retailer query (admin-added vendor record — no linked login)
export const INSERT_RETAILER = `
  INSERT INTO retailers (
    id, name, email, phone, street_address, city, state, zip_code, country,
    business_name, business_type, registration_number, bank_name, account_number, account_name
  ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

// Insert retailer query for self-registration — linked to the new login via
// user_id, starts 'inactive' until the account's OTP is verified (mirrors
// users.status), and leaves registration_number/bank details for an admin to
// fill in later.
export const INSERT_RETAILER_FOR_USER = `
  INSERT INTO retailers (
    id, user_id, name, email, phone, street_address, city, state, zip_code, country,
    business_name, business_type, status
  ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive');
`;

// Get all retailers with pagination. total_orders/total_sales are computed
// live from the orders table (cancelled orders excluded) rather than read
// from the stored counter columns, which nothing keeps in sync as orders
// are placed.
export const GET_RETAILERS = `
  SELECT r.*,
    (SELECT COUNT(*) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_orders,
    (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_sales
  FROM retailers r
  WHERE
    CASE WHEN ? IS NOT NULL THEN r.business_type = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN r.status = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN r.city = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN (r.name LIKE ? OR r.email LIKE ? OR r.business_name LIKE ?) ELSE 1 END
  ORDER BY r.created_at DESC
  LIMIT ? OFFSET ?;
`;

// Count total retailers (for pagination)
export const COUNT_RETAILERS = `
  SELECT COUNT(*) as total FROM retailers
  WHERE
    CASE WHEN ? IS NOT NULL THEN business_type = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN status = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN city = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN (name LIKE ? OR email LIKE ? OR business_name LIKE ?) ELSE 1 END;
`;

// Get single retailer (live order stats — see GET_RETAILERS)
export const GET_RETAILER = `
  SELECT r.*,
    (SELECT COUNT(*) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_orders,
    (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_sales
  FROM retailers r WHERE r.id = ?;
`;

// Get the retailer record linked to a given login (live order stats — see GET_RETAILERS)
export const GET_RETAILER_BY_USER_ID = `
  SELECT r.*,
    (SELECT COUNT(*) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_orders,
    (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.retailer_id = r.id AND o.status != 'cancelled') AS live_total_sales
  FROM retailers r WHERE r.user_id = ?;
`;

// Check if a retailer with this email already exists (used to give a clean
// error at signup instead of a raw duplicate-key 500)
export const GET_RETAILER_BY_EMAIL = `
  SELECT id FROM retailers WHERE email = ?;
`;

// Update retailer (admin — any retailer by id)
export const UPDATE_RETAILER = `
  UPDATE retailers
  SET
    name = ?,
    phone = ?,
    street_address = ?,
    city = ?,
    state = ?,
    zip_code = ?,
    country = ?,
    business_name = ?,
    business_type = ?,
    registration_number = ?,
    bank_name = ?,
    account_number = ?,
    account_name = ?
  WHERE id = ?;
`;

// Update retailer (self-service — the owner editing their own record via
// /retailers/me). Deliberately excludes registration_number and status:
// those stay admin-controlled (verification / suspension).
export const UPDATE_MY_RETAILER = `
  UPDATE retailers
  SET
    name = ?,
    phone = ?,
    street_address = ?,
    city = ?,
    state = ?,
    zip_code = ?,
    country = ?,
    business_name = ?,
    business_type = ?,
    bank_name = ?,
    account_number = ?,
    account_name = ?
  WHERE user_id = ?;
`;

// Delete retailer
export const DELETE_RETAILER = `
  DELETE FROM retailers WHERE id = ?;
`;
