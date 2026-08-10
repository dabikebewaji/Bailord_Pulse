import crypto from "crypto";
import { pool } from "../config/db.js";

export const CREATE_ORDERS_TABLES = `
  CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    retailer_id VARCHAR(36) NOT NULL,
    status ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_retailer_id (retailer_id),
    INDEX idx_status (status),
    CONSTRAINT fk_orders_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

export const CREATE_ORDER_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

// items: [{ productId, quantity }]. Uses a single dedicated connection for
// the whole transaction (not pool.query directly — a connection pool can
// hand out a different underlying connection per pool.query() call, which
// would silently break atomicity here, unlike the simpler single-statement
// queries elsewhere in the app).
export const placeOrder = async (retailerId, items) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const orderId = crypto.randomUUID();
    let totalAmount = 0;
    const lineItems = [];

    for (const { productId, quantity } of items) {
      if (!productId || !quantity || quantity < 1) {
        throw Object.assign(new Error('Each item needs a productId and a quantity of at least 1'), { status: 400 });
      }

      const [rows] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      const product = rows[0];
      if (!product || !product.is_active) {
        throw Object.assign(new Error(`Product ${productId} is not available`), { status: 400 });
      }
      if (product.stock_quantity < quantity) {
        throw Object.assign(new Error(`Not enough stock for "${product.name}" (${product.stock_quantity} left)`), { status: 400 });
      }

      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, productId]);

      const unitPrice = product.price;
      totalAmount += Number(unitPrice) * quantity;
      lineItems.push({ productId, quantity, unitPrice });
    }

    await conn.query(
      'INSERT INTO orders (id, retailer_id, status, total_amount) VALUES (?, ?, ?, ?)',
      [orderId, retailerId, 'pending', totalAmount]
    );

    for (const item of lineItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await conn.commit();
    return orderId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const withItems = async (orders) => {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o.id);
  const [items] = await pool.query(
    `SELECT oi.*, p.name AS product_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (?)`,
    [ids]
  );
  return orders.map((order) => ({
    ...order,
    items: items.filter((i) => i.order_id === order.id),
  }));
};

export const getOrdersForRetailer = async (retailerId) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE retailer_id = ? ORDER BY created_at DESC',
    [retailerId]
  );
  return withItems(orders);
};

export const getAllOrders = async (status) => {
  const [orders] = await pool.query(
    status
      ? 'SELECT o.*, r.business_name FROM orders o JOIN retailers r ON r.id = o.retailer_id WHERE o.status = ? ORDER BY o.created_at DESC'
      : 'SELECT o.*, r.business_name FROM orders o JOIN retailers r ON r.id = o.retailer_id ORDER BY o.created_at DESC',
    status ? [status] : []
  );
  return withItems(orders);
};

export const getOrderById = async (orderId) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!orders.length) return null;
  const [withItemsResult] = await withItems(orders);
  return withItemsResult;
};

// Restores stock when an order is cancelled — the inverse of the reservation
// made in placeOrder.
export const updateOrderStatus = async (orderId, status) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = orders[0];
    if (!order) {
      await conn.rollback();
      return null;
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    await conn.commit();
    return { ...order, status };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
