// Create products table query
export const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(100),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

export const INSERT_PRODUCT = `
  INSERT INTO products (id, name, sku, description, price, stock_quantity, category, is_active)
  VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?);
`;

// Filters mirror retailerQueries.js's GET_RETAILERS pattern (CASE WHEN ? IS
// NOT NULL trick keeps this fully parameterized with no string concat).
export const GET_PRODUCTS = `
  SELECT * FROM products
  WHERE
    CASE WHEN ? IS NOT NULL THEN category = ? ELSE 1 END
    AND CASE WHEN ? IS NOT NULL THEN is_active = ? ELSE 1 END
  ORDER BY created_at DESC;
`;

export const GET_PRODUCT = `
  SELECT * FROM products WHERE id = ?;
`;

export const UPDATE_PRODUCT = `
  UPDATE products
  SET
    name = ?,
    sku = ?,
    description = ?,
    price = ?,
    stock_quantity = ?,
    category = ?,
    is_active = ?
  WHERE id = ?;
`;
