import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  CREATE_ORDERS_TABLES,
  CREATE_ORDER_ITEMS_TABLE,
  placeOrder,
  getOrdersForRetailer,
  getAllOrders as getAllOrdersModel,
  getOrderById,
  updateOrderStatus as updateOrderStatusModel,
} from '../models/orderModel.js';

// Bootstrap (same pattern as productController.js) — order_items has an FK to
// orders, so it must be created after orders exists.
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query(CREATE_ORDERS_TABLES);
    await conn.query(CREATE_ORDER_ITEMS_TABLE);
    conn.release();
    console.log('✅ Orders tables ready');
  } catch (error) {
    console.error('❌ Error creating orders tables:', error);
  }
})();

const formatOrder = (order) => ({
  id: order.id,
  retailerId: order.retailer_id,
  businessName: order.business_name,
  status: order.status,
  totalAmount: order.total_amount,
  notes: order.notes,
  createdAt: order.created_at,
  updatedAt: order.updated_at,
  items: (order.items || []).map((item) => ({
    productId: item.product_id,
    productName: item.product_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  })),
});

// Resolves the logged-in user's linked retailer business id, the same way
// getMyProjects does in projectController.js.
const getMyRetailerId = async (userId) => {
  const [retailers] = await pool.query('SELECT id FROM retailers WHERE user_id = ?', [userId]);
  return retailers[0]?.id ?? null;
};

export const placeMyOrder = catchAsync(async (req, res) => {
  const retailerId = await getMyRetailerId(req.user.id);
  if (!retailerId) {
    return res.status(404).json({ status: 'error', message: 'No retailer business is linked to your account' });
  }

  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ status: 'error', message: 'At least one item is required' });
  }

  try {
    const orderId = await placeOrder(retailerId, items);
    const order = await getOrderById(orderId);
    res.status(201).json({ status: 'success', data: { order: formatOrder(order) } });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    throw error;
  }
});

export const getMyOrders = catchAsync(async (req, res) => {
  const retailerId = await getMyRetailerId(req.user.id);
  if (!retailerId) {
    return res.status(200).json({ status: 'success', results: 0, data: { orders: [] } });
  }

  const orders = await getOrdersForRetailer(retailerId);
  res.json({ status: 'success', results: orders.length, data: { orders: orders.map(formatOrder) } });
});

// admin/staff/superadmin only (enforced in the route)
export const getAllOrders = catchAsync(async (req, res) => {
  const orders = await getAllOrdersModel(req.query.status || null);
  res.json({ status: 'success', results: orders.length, data: { orders: orders.map(formatOrder) } });
});

// Open to any authenticated role, but ownership-checked here: admin/staff/
// superadmin can view any order, a retailer only their own.
export const getOrder = catchAsync(async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ status: 'error', message: 'Order not found' });
  }

  if (req.user.role === 'retailer') {
    const retailerId = await getMyRetailerId(req.user.id);
    if (order.retailer_id !== retailerId) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this order' });
    }
  }

  res.json({ status: 'success', data: { order: formatOrder(order) } });
});

// admin/staff/superadmin only (enforced in the route)
export const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ status: 'error', message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = await updateOrderStatusModel(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ status: 'error', message: 'Order not found' });
  }

  const order = await getOrderById(req.params.id);
  res.json({ status: 'success', data: { order: formatOrder(order) } });
});
