import { pool } from '../config/db.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  CREATE_RETAILERS_TABLE,
  INSERT_RETAILER,
  GET_RETAILERS,
  GET_RETAILER,
  GET_RETAILER_BY_USER_ID,
  UPDATE_RETAILER,
  UPDATE_MY_RETAILER,
  DELETE_RETAILER,
  COUNT_RETAILERS
} from '../models/retailerQueries.js';

// Ensure retailers table exists
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query(CREATE_RETAILERS_TABLE);
    conn.release();
    console.log('✅ Retailers table ready');
  } catch (error) {
    console.error('❌ Error creating retailers table:', error);
  }
})();

// Shared shape for every endpoint that returns a retailer — previously
// getRetailerProfile returned the raw snake_case row while createRetailer/
// getAllRetailers each duplicated this same formatting inline.
const formatRetailer = (retailer) => ({
  id: retailer.id,
  name: retailer.name,
  email: retailer.email,
  phone: retailer.phone,
  address: {
    street: retailer.street_address,
    city: retailer.city,
    state: retailer.state,
    zipCode: retailer.zip_code,
    country: retailer.country
  },
  businessName: retailer.business_name,
  businessType: retailer.business_type,
  registrationNumber: retailer.registration_number,
  status: retailer.status,
  joinedDate: retailer.joined_date,
  bankDetails: {
    bankName: retailer.bank_name,
    accountNumber: retailer.account_number,
    accountName: retailer.account_name
  },
  metrics: {
    totalSales: retailer.live_total_sales ?? retailer.total_sales,
    totalOrders: retailer.live_total_orders ?? retailer.total_orders,
    averageRating: retailer.average_rating
  },
  createdAt: retailer.created_at,
  updatedAt: retailer.updated_at
});

// Create a new retailer
export const createRetailer = catchAsync(async (req, res) => {
  const {
    name, email, phone,
    address: { street, city, state, zipCode, country },
    businessName, businessType, registrationNumber,
    bankDetails: { bankName, accountNumber, accountName }
  } = req.body;

  const conn = await pool.getConnection();

  try {
    const [result] = await conn.query(INSERT_RETAILER, [
      name, email, phone, street, city, state, zipCode,
      country || 'Nigeria', businessName, businessType,
      registrationNumber, bankName, accountNumber, accountName
    ]);

    const [newRetailers] = await conn.query(GET_RETAILER, [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: {
        retailer: formatRetailer(newRetailers[0])
      }
    });
  } finally {
    conn.release();
  }
});

// Get all retailers with pagination and filters
export const getAllRetailers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { businessType, status, city, search } = req.query;
  // Was previously read but never used — the retailer search box sent
  // ?search= on every keystroke and the query filtered nothing.
  const searchTerm = search ? `%${search}%` : undefined;
  const conn = await pool.getConnection();

  try {
    // Get total count for pagination
    const [countResult] = await conn.query(COUNT_RETAILERS, [
      businessType, businessType,
      status, status,
      city, city,
      searchTerm, searchTerm, searchTerm, searchTerm
    ]);

    const total = countResult[0].total;

    // Get retailers with filters and pagination
    const [retailers] = await conn.query(GET_RETAILERS, [
      businessType, businessType,
      status, status,
      city, city,
      searchTerm, searchTerm, searchTerm, searchTerm,
      limit, offset
    ]);

    const formattedRetailers = retailers.map(formatRetailer);

    res.json({
      status: 'success',
      results: formattedRetailers.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: {
        retailers: formattedRetailers
      }
    });
  } finally {
    conn.release();
  }
});

// Get single retailer profile
export const getRetailerProfile = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const [retailers] = await conn.query(GET_RETAILER, [req.params.id]);

    if (!retailers.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        retailer: formatRetailer(retailers[0])
      }
    });
  } finally {
    conn.release();
  }
});

// Get the retailer business record linked to the logged-in user (any role —
// 404 if they have none, which is the normal case for staff/admin).
export const getMyRetailerProfile = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const [retailers] = await conn.query(GET_RETAILER_BY_USER_ID, [req.user.id]);

    if (!retailers.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No business record is linked to your account'
      });
    }

    res.json({
      status: 'success',
      data: {
        retailer: formatRetailer(retailers[0])
      }
    });
  } finally {
    conn.release();
  }
});

// Update retailer profile
export const updateRetailer = catchAsync(async (req, res) => {
  const {
    name, phone,
    address: { street, city, state, zipCode, country },
    businessName, businessType, registrationNumber,
    bankDetails: { bankName, accountNumber, accountName }
  } = req.body;

  const conn = await pool.getConnection();

  try {
    const [result] = await conn.query(UPDATE_RETAILER, [
      name, phone, street, city, state, zipCode,
      country || 'Nigeria', businessName, businessType,
      registrationNumber, bankName, accountNumber, accountName,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    const [updatedRetailer] = await conn.query(GET_RETAILER, [req.params.id]);

    res.json({
      status: 'success',
      data: {
        retailer: formatRetailer(updatedRetailer[0])
      }
    });
  } finally {
    conn.release();
  }
});

// Update the retailer business record linked to the logged-in user. Owner
// self-edit — status and registration_number stay admin-controlled, not
// accepted here.
export const updateMyRetailerProfile = catchAsync(async (req, res) => {
  const {
    name, phone,
    address: { street, city, state, zipCode, country } = {},
    businessName, businessType,
    bankDetails: { bankName, accountNumber, accountName } = {}
  } = req.body;

  const conn = await pool.getConnection();

  try {
    const [result] = await conn.query(UPDATE_MY_RETAILER, [
      name, phone, street, city, state, zipCode,
      country || 'Nigeria', businessName, businessType,
      bankName, accountNumber, accountName,
      req.user.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No business record is linked to your account'
      });
    }

    const [updatedRetailer] = await conn.query(GET_RETAILER_BY_USER_ID, [req.user.id]);

    res.json({
      status: 'success',
      data: {
        retailer: formatRetailer(updatedRetailer[0])
      }
    });
  } finally {
    conn.release();
  }
});

// Delete retailer
export const deleteRetailer = catchAsync(async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const [result] = await conn.query(DELETE_RETAILER, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    res.json({
      status: 'success',
      data: null
    });
  } finally {
    conn.release();
  }
});

// Update retailer metrics
// Only average_rating is meaningfully settable here — total_sales/
// total_orders are computed live from the orders table (see GET_RETAILER)
// and would just be masked by that live value on the next read anyway.
// Partial update so setting one field doesn't null out the others.
export const updateRetailerMetrics = catchAsync(async (req, res) => {
  const { totalSales, totalOrders, averageRating } = req.body;
  const conn = await pool.getConnection();

  try {
    const fields = [];
    const values = [];
    if (typeof totalSales !== 'undefined') { fields.push('total_sales = ?'); values.push(totalSales); }
    if (typeof totalOrders !== 'undefined') { fields.push('total_orders = ?'); values.push(totalOrders); }
    if (typeof averageRating !== 'undefined') { fields.push('average_rating = ?'); values.push(averageRating); }

    if (fields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No metrics provided to update' });
    }

    values.push(req.params.id);
    const [result] = await conn.query(`UPDATE retailers SET ${fields.join(', ')} WHERE id = ?`, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Retailer not found'
      });
    }

    const [updatedRetailer] = await conn.query(GET_RETAILER, [req.params.id]);

    res.json({
      status: 'success',
      data: {
        retailer: formatRetailer(updatedRetailer[0])
      }
    });
  } finally {
    conn.release();
  }
});
