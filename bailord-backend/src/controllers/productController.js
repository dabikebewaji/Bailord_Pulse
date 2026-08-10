import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  CREATE_PRODUCTS_TABLE,
  INSERT_PRODUCT,
  GET_PRODUCTS,
  GET_PRODUCT,
  UPDATE_PRODUCT,
} from '../models/productQueries.js';

// Ensure products table exists (same bootstrap pattern as retailerController.js)
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query(CREATE_PRODUCTS_TABLE);
    conn.release();
    console.log('✅ Products table ready');
  } catch (error) {
    console.error('❌ Error creating products table:', error);
  }
})();

const formatProduct = (product) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  description: product.description,
  price: product.price,
  stockQuantity: product.stock_quantity,
  category: product.category,
  isActive: !!product.is_active,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
});

// List products — any authenticated role (retailers need to browse to order).
// ?activeOnly=true restricts to is_active=1, used by the retailer ordering UI.
export const getAllProducts = catchAsync(async (req, res) => {
  const { category } = req.query;
  const isActive = req.query.activeOnly === 'true' ? 1 : null;

  const [products] = await pool.query(GET_PRODUCTS, [
    category || null, category || null,
    isActive, isActive,
  ]);

  res.json({
    status: 'success',
    results: products.length,
    data: { products: products.map(formatProduct) },
  });
});

export const getProduct = catchAsync(async (req, res) => {
  const [products] = await pool.query(GET_PRODUCT, [req.params.id]);
  if (!products.length) {
    return res.status(404).json({ status: 'error', message: 'Product not found' });
  }
  res.json({ status: 'success', data: { product: formatProduct(products[0]) } });
});

// admin/staff/superadmin only (enforced in the route)
export const createProduct = catchAsync(async (req, res) => {
  const { name, sku, description, price, stockQuantity, category, isActive } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ status: 'error', message: 'name and price are required' });
  }

  const [result] = await pool.query(INSERT_PRODUCT, [
    name, sku || null, description || null, price,
    stockQuantity || 0, category || null, isActive === false ? 0 : 1,
  ]);

  const [products] = await pool.query(GET_PRODUCT, [result.insertId]);
  res.status(201).json({ status: 'success', data: { product: formatProduct(products[0]) } });
});

export const updateProduct = catchAsync(async (req, res) => {
  const { name, sku, description, price, stockQuantity, category, isActive } = req.body;

  const [existing] = await pool.query(GET_PRODUCT, [req.params.id]);
  if (!existing.length) {
    return res.status(404).json({ status: 'error', message: 'Product not found' });
  }
  const current = existing[0];

  await pool.query(UPDATE_PRODUCT, [
    name ?? current.name,
    sku ?? current.sku,
    description ?? current.description,
    price ?? current.price,
    stockQuantity ?? current.stock_quantity,
    category ?? current.category,
    isActive === undefined ? current.is_active : (isActive ? 1 : 0),
    req.params.id,
  ]);

  const [updated] = await pool.query(GET_PRODUCT, [req.params.id]);
  res.json({ status: 'success', data: { product: formatProduct(updated[0]) } });
});

// Soft-deactivate rather than hard-delete: past orders reference products via
// a foreign key, so a real DELETE would fail (or destroy order history) for
// anything that's ever been ordered. Deactivated products are hidden from
// the retailer ordering UI (?activeOnly=true) but stay visible to admins.
export const deleteProduct = catchAsync(async (req, res) => {
  const [existing] = await pool.query(GET_PRODUCT, [req.params.id]);
  if (!existing.length) {
    return res.status(404).json({ status: 'error', message: 'Product not found' });
  }
  const current = existing[0];

  await pool.query(UPDATE_PRODUCT, [
    current.name, current.sku, current.description, current.price,
    current.stock_quantity, current.category, 0,
    req.params.id,
  ]);

  res.json({ status: 'success', data: null });
});
