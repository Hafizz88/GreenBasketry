import { client } from '../db.js';
import { uploadImageToCloudinary } from '../controllers/cloudinaryController.js';
import { v2 as cloudinary } from 'cloudinary';

// Add a new product
export const addProduct = async (req, res) => {
  const { name, category, price, stock, description, discount_percentage, vat_percentage, discount_started, discount_finished } = req.body;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  let imageUrl = null;

  try {
    // Upload image if present
    if (req.file) {
      // Create folder path based on category
      const folderPath = `ecommerce/${category.toLowerCase().replace(/\s+/g, '_')}`;
      imageUrl = await uploadImageToCloudinary(req.file.buffer, folderPath);
    }

    const result = await client.query(
      `INSERT INTO products (name, category, price, stock, description, image_url, discount_percentage, vat_percentage, updated_by_admin_id, discount_started, discount_finished)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, category, price, stock, description, imageUrl, discount_percentage, vat_percentage, admin_id, discount_started, discount_finished]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

// Update product price
export const updateProductPrice = async (req, res) => {
  const { product_id, price } = req.body;
  try {
    const result = await client.query(
      `UPDATE products SET price = $1 WHERE product_id = $2 RETURNING *`,
      [price, product_id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product price:', err);
    res.status(500).json({ error: 'Failed to update product price' });
  }
};

// Create a new discount coupon
export const createCoupon = async (req, res) => {
  const { code, description, discount_percent, valid_from, valid_to, required_point } = req.body;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    const result = await client.query(
      `INSERT INTO coupons (code, description, discount_percent, valid_from, valid_to, created_by_admin_id, required_point)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, description, discount_percent, valid_from, valid_to, admin_id, required_point]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get the product's image_url
    const productRes = await client.query('SELECT image_url FROM products WHERE product_id = $1', [id]);
    const imageUrl = productRes.rows[0]?.image_url;

    // 2. Delete related records
    await client.query('DELETE FROM cart_items WHERE product_id = $1', [id]);
    await client.query('DELETE FROM buy_history WHERE product_id = $1', [id]);
    await client.query('DELETE FROM wishlist WHERE product_id = $1', [id]);

    // 3. Delete the product
    await client.query('DELETE FROM products WHERE product_id = $1', [id]);

    // 4. Delete image from Cloudinary if exists
    if (imageUrl) {
      // Extract public_id from imageUrl
      // Example: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/ecommerce/category/filename.jpg
      const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
      const publicId = match ? match[1] : null;
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
          console.error('Cloudinary image deletion error:', cloudErr);
        }
      }
    }

    res.json({ message: 'Product and related data deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product and related data' });
  }
};

// Update all product fields (except id)
export const updateProduct = async (req, res) => {
  const { product_id, name, category, price, stock, description, image_url, discount_percentage, vat_percentage } = req.body;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    const result = await client.query(
      `UPDATE products SET name=$1, category=$2, price=$3, stock=$4, description=$5, image_url=$6, discount_percentage=$7, vat_percentage=$8, updated_by_admin_id=$9 WHERE product_id=$10 RETURNING *`,
      [name, category, price, stock, description, image_url, discount_percentage, vat_percentage, admin_id, product_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Set product discount and validity
export const setProductDiscount = async (req, res) => {
  const { product_id } = req.params;
  const { discount_percentage, discount_started, discount_finished } = req.body;
  const admin_id = req.user && req.user.id;
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    const result = await client.query(
      `UPDATE products SET discount_percentage=$1, discount_started=$2, discount_finished=$3, updated_by_admin_id=$4, last_updated=NOW() WHERE product_id=$5 RETURNING *`,
      [discount_percentage, discount_started, discount_finished, admin_id, product_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to set discount' });
  }
};

// Get all coupons
export const getAllCoupons = async (req, res) => {
  // Accept customer_id as query param
  const customer_id = req.query.customer_id;
  try {
    if (customer_id) {
      // Get available points for the customer
      const pointsRes = await client.query(
        `SELECT (COALESCE(points_earned, 0) - COALESCE(points_used, 0)) as available_points FROM customers WHERE customer_id = $1`,
        [customer_id]
      );
      const available_points = Number(pointsRes.rows[0]?.available_points) || 0;
      // Only return coupons the customer can afford
      const result = await client.query(
        'SELECT * FROM coupons WHERE is_active = true AND required_point <= $1',
        [available_points]
      );
      res.json(result.rows);
    } else {
      // Fallback: return all active coupons
      const result = await client.query('SELECT * FROM coupons WHERE is_active = true ORDER BY coupon_id DESC');
    res.json(result.rows);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    // Instead of deleting, set is_active to false
    await client.query('UPDATE coupons SET is_active = false, created_by_admin_id = $1 WHERE coupon_id = $2', [admin_id, id]);
    res.json({ message: 'Coupon deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate coupon' });
    console.log(err);
  }
};

// Update a coupon
export const updateCoupon = async (req, res) => {
  const coupon_id = req.params.id;
  const { code, description, discount_percent, valid_from, valid_to, is_active, required_point } = req.body;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    const result = await client.query(
      `UPDATE coupons SET code=$1, description=$2, discount_percent=$3, valid_from=$4, valid_to=$5, is_active=$6, created_by_admin_id=$7, required_point=$8 WHERE coupon_id=$9 RETURNING *`,
      [code, description, discount_percent, valid_from, valid_to, is_active, admin_id, required_point, coupon_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

// Mark a complaint as resolved
export const resolveComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      'UPDATE complaints SET resolved = true WHERE complaint_id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
};

// Run discount expiry function
export const runDiscountExpiry = async (req, res) => {
  try {
    await client.query('SELECT reset_expired_product_discounts();');
    res.json({ message: 'Expired discounts reset.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset discounts.' });
  }
};

// Get all admins
export const getAllAdmins = async (req, res) => {
  try {
    const result = await client.query('SELECT admin_id, name, email, phone FROM admins');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

// Get rider statistics
export const getRiderStats = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(o.order_date) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "AND DATE(o.order_date) = CURRENT_DATE";
    }
    
    // Get comprehensive rider statistics
    const statsQuery = await client.query(
      `SELECT 
        r.rider_id,
        r.name,
        r.phone,
        r.email,
        r.vehicle_info,
        r.available,
        
        -- Today's stats (completed deliveries only)
        COUNT(CASE WHEN DATE(o.order_date) = CURRENT_DATE AND d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN 1 END) as today_deliveries,
        COALESCE(SUM(CASE WHEN DATE(o.order_date) = CURRENT_DATE AND d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN o.total_amount END), 0) as today_amount,
        
        -- Period stats (completed deliveries only)
        COUNT(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' ${dateFilter} THEN 1 END) as period_deliveries,
        COALESCE(SUM(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' ${dateFilter} THEN o.total_amount END), 0) as period_amount,
        
        -- Overall stats (completed deliveries only)
        COUNT(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN 1 END) as total_deliveries,
        COALESCE(SUM(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN o.total_amount END), 0) as total_amount,
        
        -- Failed deliveries
        COUNT(CASE WHEN d.delivery_status = 'failed' THEN 1 END) as failed_deliveries,
        
        -- Success rate (delivered vs failed)
        CASE 
          WHEN COUNT(CASE WHEN d.delivery_status IN ('delivered', 'failed') THEN 1 END) > 0 
          THEN ROUND(
            (COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END)::DECIMAL / 
             COUNT(CASE WHEN d.delivery_status IN ('delivered', 'failed') THEN 1 END)::DECIMAL) * 100, 2
          )
          ELSE 0 
        END as success_rate,
        
        -- Average delivery time (in minutes) - only for completed deliveries
        AVG(
          CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered'
          THEN EXTRACT(EPOCH FROM (da.assigned_at - o.order_date)) / 60
          ELSE NULL END
        ) as avg_delivery_time_minutes,
        
        -- Recent activity
        MAX(CASE WHEN d.delivery_status = 'delivered' THEN o.order_date END) as last_delivery_date,
        COUNT(CASE WHEN d.delivery_status = 'out_for_delivery' THEN 1 END) as active_deliveries
        
      FROM riders r
      LEFT JOIN delivery_assignments da ON r.rider_id = da.rider_id
      LEFT JOIN deliveries d ON da.delivery_id = d.delivery_id
      LEFT JOIN orders o ON d.order_id = o.order_id
      WHERE r.rider_id = $1
      GROUP BY r.rider_id, r.name, r.phone, r.email, r.vehicle_info, r.available`,
      [riderId]
    );
    
    if (statsQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    // Get detailed delivery history for the period
    const historyQuery = await client.query(
      `SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        d.delivery_status,
        o.order_status,
        c.name as customer_name,
        addr.address_line,
        EXTRACT(EPOCH FROM (da.assigned_at - o.order_date)) / 60 as delivery_time_minutes
      FROM delivery_assignments da
      JOIN deliveries d ON da.delivery_id = d.delivery_id
      JOIN orders o ON d.order_id = o.order_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN addresses addr ON o.address_id = addr.address_id
      WHERE da.rider_id = $1 ${dateFilter}
      ORDER BY o.order_date DESC
      LIMIT 20`,
      [riderId]
    );
    
    const result = {
      ...statsQuery.rows[0],
      delivery_history: historyQuery.rows
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching rider stats:', err);
    res.status(500).json({ error: 'Failed to fetch rider statistics' });
  }
};

// Get all riders with basic stats
export const getAllRidersWithStats = async (req, res) => {
  try {
    const ridersQuery = await client.query(
      `SELECT 
        r.rider_id,
        r.name,
        r.phone,
        r.email,
        r.vehicle_info,
        r.available,
        
        -- Today's stats (completed deliveries only)
        COUNT(CASE WHEN DATE(o.order_date) = CURRENT_DATE AND d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN 1 END) as today_deliveries,
        COALESCE(SUM(CASE WHEN DATE(o.order_date) = CURRENT_DATE AND d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN o.total_amount END), 0) as today_amount,
        
        -- Total stats (completed deliveries only)
        COUNT(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN 1 END) as total_deliveries,
        COALESCE(SUM(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN o.total_amount END), 0) as total_amount,
        
        -- Success rate (delivered vs failed)
        CASE 
          WHEN COUNT(CASE WHEN d.delivery_status IN ('delivered', 'failed') THEN 1 END) > 0 
          THEN ROUND(
            (COUNT(CASE WHEN d.delivery_status = 'delivered' THEN 1 END)::DECIMAL / 
             COUNT(CASE WHEN d.delivery_status IN ('delivered', 'failed') THEN 1 END)::DECIMAL) * 100, 2
          )
          ELSE 0 
        END as success_rate,
        
        -- Last delivery (completed deliveries only)
        MAX(CASE WHEN d.delivery_status = 'delivered' AND o.order_status = 'delivered' THEN o.order_date END) as last_delivery_date
        
      FROM riders r
      LEFT JOIN delivery_assignments da ON r.rider_id = da.rider_id
      LEFT JOIN deliveries d ON da.delivery_id = d.delivery_id
      LEFT JOIN orders o ON d.order_id = o.order_id
      GROUP BY r.rider_id, r.name, r.phone, r.email, r.vehicle_info, r.available
      ORDER BY today_deliveries DESC, total_deliveries DESC`
    );
    
    res.json(ridersQuery.rows);
  } catch (err) {
    console.error('Error fetching riders with stats:', err);
    res.status(500).json({ error: 'Failed to fetch riders with statistics' });
  }
};

// Get admin activity logs
export const getAdminActivityLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action_type, 
      table_name, 
      admin_user_id,
      start_date,
      end_date,
      search 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE clause based on filters
    if (action_type) {
      whereConditions.push(`action_type = $${paramIndex}`);
      queryParams.push(action_type);
      paramIndex++;
    }

    if (table_name) {
      whereConditions.push(`table_name = $${paramIndex}`);
      queryParams.push(table_name);
      paramIndex++;
    }

    if (admin_user_id) {
      whereConditions.push(`admin_user_id = $${paramIndex}`);
      queryParams.push(admin_user_id);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`DATE(timestamp) >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`DATE(timestamp) <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(description ILIKE $${paramIndex} OR admin_user_id ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM greenbasketary_admin_log 
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, queryParams);
    const totalLogs = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalLogs / limit);

    // Get logs with pagination
    const logsQuery = `
      SELECT 
        log_id,
        admin_user_id,
        timestamp,
        action_type,
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        description
      FROM greenbasketary_admin_log 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const logsResult = await client.query(logsQuery, queryParams);

    // Get unique values for filters
    const actionTypesQuery = await client.query('SELECT DISTINCT action_type FROM greenbasketary_admin_log ORDER BY action_type');
    const tableNamesQuery = await client.query('SELECT DISTINCT table_name FROM greenbasketary_admin_log ORDER BY table_name');
    const adminUsersQuery = await client.query('SELECT DISTINCT admin_user_id FROM greenbasketary_admin_log WHERE admin_user_id IS NOT NULL ORDER BY admin_user_id');

    res.json({
      logs: logsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs,
        limit: parseInt(limit)
      },
      filters: {
        actionTypes: actionTypesQuery.rows.map(row => row.action_type),
        tableNames: tableNamesQuery.rows.map(row => row.table_name),
        adminUsers: adminUsersQuery.rows.map(row => row.admin_user_id)
      }
    });
  } catch (err) {
    console.error('Error fetching admin activity logs:', err);
    res.status(500).json({ error: 'Failed to fetch admin activity logs' });
  }
};

// Get admin activity summary statistics
export const getAdminActivitySummary = async (req, res) => {
  try {
    const summaryQuery = await client.query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT admin_user_id) as unique_admins,
        COUNT(DISTINCT table_name) as tables_affected,
        COUNT(DISTINCT action_type) as action_types,
        COUNT(CASE WHEN action_type = 'CREATE' THEN 1 END) as create_actions,
        COUNT(CASE WHEN action_type = 'UPDATE' THEN 1 END) as update_actions,
        COUNT(CASE WHEN action_type = 'DELETE' THEN 1 END) as delete_actions,
        COUNT(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 END) as today_actions,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_actions,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_actions,
        MAX(timestamp) as last_action_time
      FROM greenbasketary_admin_log
    `);

    const topAdminsQuery = await client.query(`
      SELECT 
        admin_user_id,
        COUNT(*) as action_count
      FROM greenbasketary_admin_log 
      WHERE admin_user_id IS NOT NULL
      GROUP BY admin_user_id 
      ORDER BY action_count DESC 
      LIMIT 5
    `);

    const topTablesQuery = await client.query(`
      SELECT 
        table_name,
        COUNT(*) as action_count
      FROM greenbasketary_admin_log 
      GROUP BY table_name 
      ORDER BY action_count DESC 
      LIMIT 5
    `);

    res.json({
      summary: summaryQuery.rows[0],
      topAdmins: topAdminsQuery.rows,
      topTables: topTablesQuery.rows
    });
  } catch (err) {
    console.error('Error fetching admin activity summary:', err);
    res.status(500).json({ error: 'Failed to fetch admin activity summary' });
  }
};
