import { client } from '../db.js';
import { uploadImageToCloudinary } from '../controllers/cloudinaryController.js';
import { v2 as cloudinary } from 'cloudinary';

// Add a new product
export const addProduct = async (req, res) => {
  const { name, category, price, stock, description, discount_percentage, vat_percentage, discount_started, discount_finished, points_rewarded } = req.body;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  let imageUrl = null;

  // Validate admin_id
  if (!admin_id) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    // First, verify that the admin exists
    const adminCheck = await client.query(
      'SELECT admin_id, name FROM admins WHERE admin_id = $1',
      [admin_id]
    );

    if (adminCheck.rows.length === 0) {
      console.error(`Admin with ID ${admin_id} not found in database`);
      return res.status(401).json({ 
        error: 'Invalid admin session. Please log in again.',
        details: `Admin ID ${admin_id} does not exist in database. Valid admin IDs: 1, 4, 5`
      });
    }

    console.log(`✅ Admin verified: ${adminCheck.rows[0].name} (ID: ${admin_id})`);

    // Upload image if present
    if (req.file) {
      // Create folder path based on category
      const folderPath = `ecommerce/${category.toLowerCase().replace(/\s+/g, '_')}`;
      imageUrl = await uploadImageToCloudinary(req.file.buffer, folderPath);
    }

    // Check for existing product with same name and category
    const existingProductCheck = await client.query(
      'SELECT product_id, name, category, price, stock FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND LOWER(TRIM(category)) = LOWER(TRIM($2))',
      [name, category]
    );

    if (existingProductCheck.rows.length > 0) {
      // Product with same name and category exists - UPDATE it
      const existingProduct = existingProductCheck.rows[0];
      console.log(`🔄 Updating existing product: ${existingProduct.name} (ID: ${existingProduct.product_id}) in category: ${existingProduct.category}`);
      console.log(`   Old values - Price: ${existingProduct.price}, Stock: ${existingProduct.stock}`);
      console.log(`   New values - Price: ${price}, Stock: ${stock}`);
      
      // Validate that we're not setting stock to negative
      if (stock < 0) {
        return res.status(400).json({ 
          error: 'Stock cannot be negative',
          details: 'Please enter a valid stock quantity (0 or greater)'
        });
      }
      
      const updateResult = await client.query(
        `UPDATE products 
         SET price = $1, stock = $2, description = $3, image_url = COALESCE($4, image_url), 
             discount_percentage = $5, vat_percentage = $6, discount_started = $7, 
             discount_finished = $8, points_rewarded = $9, updated_by_admin_id = $10, last_updated = NOW()
         WHERE product_id = $11 RETURNING *`,
        [price, stock, description, imageUrl, discount_percentage, vat_percentage, discount_started, discount_finished, points_rewarded, admin_id, existingProduct.product_id]
      );
      
      console.log(`✅ Product updated successfully: ${updateResult.rows[0].name} (ID: ${updateResult.rows[0].product_id})`);
      return res.status(200).json({
        message: 'Product updated successfully',
        action: 'updated',
        product: updateResult.rows[0],
        previousValues: {
          price: existingProduct.price,
          stock: existingProduct.stock
        }
      });
    }

    // Check for products with same name but different category
    const sameNameDifferentCategory = await client.query(
      'SELECT product_id, name, category FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND LOWER(TRIM(category)) != LOWER(TRIM($2))',
      [name, category]
    );

    if (sameNameDifferentCategory.rows.length > 0) {
      console.log(`📝 Found ${sameNameDifferentCategory.rows.length} product(s) with same name but different category:`);
      sameNameDifferentCategory.rows.forEach(product => {
        console.log(`   - ${product.name} in category: ${product.category} (ID: ${product.product_id})`);
      });
      console.log(`🆕 Creating new product: ${name} in category: ${category}`);
    }

    // Validate inputs before creating new product
    if (stock < 0) {
      return res.status(400).json({ 
        error: 'Stock cannot be negative',
        details: 'Please enter a valid stock quantity (0 or greater)'
      });
    }
    
    if (price < 0) {
      return res.status(400).json({ 
        error: 'Price cannot be negative',
        details: 'Please enter a valid price (0 or greater)'
      });
    }

    // Create new product (either no existing product with same name, or same name but different category)
    const result = await client.query(
      `INSERT INTO products (name, category, price, stock, description, image_url, discount_percentage, vat_percentage, updated_by_admin_id, discount_started, discount_finished, points_rewarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, category, price, stock, description, imageUrl, discount_percentage, vat_percentage, admin_id, discount_started, discount_finished, points_rewarded]
    );
    
    console.log(`✅ New product created successfully: ${result.rows[0].name} (ID: ${result.rows[0].product_id}) in category: ${result.rows[0].category}`);
    res.status(201).json({
      message: 'Product created successfully',
      action: 'created',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding product:', err);
    
    // Provide more specific error messages
    if (err.code === '23503' && err.constraint === 'products_updated_by_admin_id_fkey') {
      res.status(401).json({ 
        error: 'Invalid admin session. Please log in again.',
        details: `Admin ID ${admin_id} does not exist in database`
      });
    } else {
      res.status(500).json({ error: 'Failed to add product' });
    }
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

// Soft delete a product by setting stock to 0
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // Set stock to 0 instead of deleting
    const result = await client.query(
      'UPDATE products SET stock = 0 WHERE product_id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product stock set to 0 (soft deleted)', product: result.rows[0] });
  } catch (err) {
    console.error('Error soft deleting product:', err);
    res.status(500).json({ error: 'Failed to soft delete product' });
  }
};

// Update product details (excluding name, category, and image_url)
export const updateProduct = async (req, res) => {
  console.log('updateProduct called with:', req.body, req.params);
  const { price, stock, description, vat_percentage, discount_percentage, discount_started, discount_finished, points_rewarded } = req.body;
  const product_id = req.params.id;
  const admin_id = req.user && req.user.id; // Get admin_id from authenticated user
  if (!admin_id) {
    return res.status(400).json({ error: 'Admin ID is required' });
  }
  try {
    const result = await client.query(
      `UPDATE products 
       SET price=$1, stock=$2, description=$3, vat_percentage=$4, discount_percentage=$5, discount_started=$6, discount_finished=$7, points_rewarded=$8, updated_by_admin_id=$9, last_updated=NOW()
       WHERE product_id=$10 RETURNING *`,
      [price, stock, description, vat_percentage, discount_percentage, discount_started, discount_finished, points_rewarded, admin_id, product_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
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

// Get all active admins
export const getAllAdmins = async (req, res) => {
  try {
    const result = await client.query('SELECT admin_id, name, email, phone FROM admins WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

// Soft delete an admin (only allowed by superadmin, cannot delete self)
export const deleteAdmin = async (req, res) => {
  console.log('deleteAdmin called with:', req.params, 'by user:', req.user);
  const { id } = req.params; // id of the admin to delete
  const requesterId = req.user && req.user.id; // id of the admin making the request

  try {
    // 1. Check if the requester is a superadmin
    console.log('Checking if requester is superadmin, requesterId:', requesterId);
    const requesterRes = await client.query(
      'SELECT is_superadmin FROM admins WHERE admin_id = $1 AND is_active = true',
      [requesterId]
    );
    console.log('Requester query result:', requesterRes.rows);
    if (!requesterRes.rows.length || !requesterRes.rows[0].is_superadmin) {
      console.log('Access denied: requester is not superadmin');
      return res.status(403).json({ error: 'Only superadmins can delete admins.' });
    }

    // 2. Prevent deleting yourself
    if (parseInt(id) === requesterId) {
      console.log('Access denied: cannot delete self');
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // 3. Soft delete the target admin (set is_active to false)
    console.log('Soft deleting admin with ID:', id);
    const result = await client.query(
      'UPDATE admins SET is_active = false WHERE admin_id = $1 AND is_active = true RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      console.log('Admin not found with ID:', id);
      return res.status(404).json({ error: 'Admin not found or already inactive' });
    }
    console.log('Admin soft deleted successfully:', result.rows[0]);
    res.json({ message: 'Admin deactivated successfully', admin: result.rows[0] });
  } catch (err) {
    console.error('Error soft deleting admin:', err);
    res.status(500).json({ error: 'Failed to deactivate admin' });
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

// Get admin dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const statsQuery = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM riders) as total_riders,
        (SELECT COUNT(*) FROM admins) as total_admins,
        (SELECT COUNT(*) FROM orders WHERE DATE(order_date) = CURRENT_DATE) as today_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered') as delivered_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'cancelled') as cancelled_orders,
        (SELECT COUNT(*) FROM complaints WHERE resolved = false) as pending_complaints,
        (SELECT COUNT(*) FROM riders WHERE available = true) as active_riders,
        (SELECT COUNT(*) FROM products WHERE stock > 0) as in_stock_products,
        (SELECT COUNT(*) FROM products WHERE stock = 0) as out_of_stock_products,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status = 'delivered') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(order_date) = CURRENT_DATE AND order_status = 'delivered') as today_revenue
    `);

    // Get recent activity
    const recentOrdersQuery = await client.query(`
      SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.order_status,
        c.name as customer_name
      FROM orders o
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);

    // Get top selling products
    const topProductsQuery = await client.query(`
      SELECT 
        p.name,
        p.product_id,
        COUNT(bh.customer_id) as times_purchased
      FROM products p
      LEFT JOIN buy_history bh ON p.product_id = bh.product_id
      GROUP BY p.product_id, p.name
      ORDER BY times_purchased DESC
      LIMIT 5
    `);

    res.json({
      stats: statsQuery.rows[0],
      recentOrders: recentOrdersQuery.rows,
      topProducts: topProductsQuery.rows
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get cancelled orders for admin review
export const getCancelledOrders = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.points_used,
        o.points_value,
        o.order_status,
        d.delivery_id,
        d.delivery_status,
        c.name as customer_name,
        c.phone as customer_phone,
        addr.address_line,
        t.thana_name,
        dz.zone_name,
        r.name as rider_name,
        r.phone as rider_phone
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN addresses addr ON o.address_id = addr.address_id
      LEFT JOIN "Thanas" t ON addr.thana_id = t.id
      JOIN delivery_zones dz ON addr.zone_id = dz.zone_id
      LEFT JOIN delivery_assignments da ON d.delivery_id = da.delivery_id
      LEFT JOIN riders r ON da.rider_id = r.rider_id
      WHERE o.order_status = 'cancelled'
      ORDER BY o.order_date DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cancelled orders:', err);
    res.status(500).json({ error: 'Failed to fetch cancelled orders' });
  }
};

// Restore cancelled order (admin manually restores stock and marks as restored)
export const restoreCancelledOrder = async (req, res) => {
  const { orderId } = req.params;
  const admin_id = req.user && req.user.id;
  
  if (!admin_id) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    await client.query('BEGIN');

    // Get order details and cart items
    const orderResult = await client.query(`
      SELECT o.order_id, o.points_used, c.customer_id
      FROM orders o
      JOIN carts c ON o.cart_id = c.cart_id
      WHERE o.order_id = $1 AND o.order_status = 'cancelled'
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cancelled order not found' });
    }

    const order = orderResult.rows[0];

    // Get cart items to restore stock
    const cartItemsResult = await client.query(`
      SELECT ci.product_id, ci.quantity, p.name as product_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      JOIN orders o ON ci.cart_id = o.cart_id
      WHERE o.order_id = $1
    `, [orderId]);

    // Restore stock for each product
    for (const item of cartItemsResult.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
      console.log(`📦 Restored ${item.quantity} units of ${item.product_name} (ID: ${item.product_id})`);
    }

    // Update order status to restored
    await client.query(
      `UPDATE orders SET order_status = 'restored' WHERE order_id = $1`,
      [orderId]
    );

    // Update delivery status to failed (to indicate it was cancelled)
    await client.query(
      `UPDATE deliveries SET delivery_status = 'failed' WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Order restored successfully. Stock has been updated.',
      order_id: orderId,
      products_restored: cartItemsResult.rows.length,
      stock_restored: cartItemsResult.rows.reduce((sum, item) => sum + item.quantity, 0)
    });

    console.log(`✅ Order ${orderId} restored by admin ${admin_id}. Stock restored for ${cartItemsResult.rows.length} products.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error restoring cancelled order:', err);
    res.status(500).json({ error: 'Failed to restore order' });
  }
};

// Get sales report data for charts and analytics
export const getSalesReport = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // period can be 'week', 'month', 'year'
    console.log('getSalesReport called with period:', period);
    
    let dateFilter = '';
    let groupBy = '';
    
    switch (period) {
      case 'week':
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'";
        groupBy = "DATE(o.order_date)";
        break;
      case 'month':
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'";
        groupBy = "DATE(o.order_date)";
        break;
      case 'year':
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '365 days'";
        groupBy = "DATE_TRUNC('month', o.order_date)";
        break;
      default:
        dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'";
        groupBy = "DATE(o.order_date)";
    }

    console.log('Using dateFilter:', dateFilter);
    console.log('Using groupBy:', groupBy);

    // Get daily/monthly sales data
    const salesDataQuery = await client.query(`
      SELECT 
        ${groupBy} as date,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts,
        COALESCE(SUM(o.delivery_fee), 0) as total_delivery_fees
      FROM orders o
      WHERE o.order_status = 'delivered' ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `);
    console.log('Sales data query result:', salesDataQuery.rows);

    // Get top selling products - FIXED QUERY
    const topProductsQuery = await client.query(`
      SELECT 
        p.name,
        p.product_id,
        COUNT(ci.cart_item_id) as times_purchased,
        COALESCE(SUM(ci.quantity * p.price), 0) as total_revenue
      FROM products p
      JOIN cart_items ci ON p.product_id = ci.product_id
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN orders o ON c.cart_id = o.cart_id
      WHERE o.order_status = 'delivered' ${dateFilter}
      GROUP BY p.product_id, p.name
      ORDER BY times_purchased DESC
      LIMIT 10
    `);
    console.log('Top products query result:', topProductsQuery.rows);

    // Get sales by category
    const categorySalesQuery = await client.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT o.order_id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as category_revenue
      FROM orders o
      JOIN carts c ON o.cart_id = c.cart_id
      JOIN cart_items ci ON c.cart_id = ci.cart_id
      JOIN products p ON ci.product_id = p.product_id
      WHERE o.order_status = 'delivered' ${dateFilter}
      GROUP BY p.category
      ORDER BY category_revenue DESC
    `);
    console.log('Category sales query result:', categorySalesQuery.rows);

    // Get overall statistics
    const overallStatsQuery = await client.query(`
      SELECT 
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT c.customer_id) as unique_customers,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts,
        COALESCE(SUM(o.delivery_fee), 0) as total_delivery_fees
      FROM orders o
      JOIN carts c ON o.cart_id = c.cart_id
      WHERE o.order_status = 'delivered' ${dateFilter}
    `);
    console.log('Overall stats query result:', overallStatsQuery.rows);

    // Get recent orders
    const recentOrdersQuery = await client.query(`
      SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        o.order_status,
        c.name as customer_name,
        COUNT(ci.cart_item_id) as items_count
      FROM orders o
      JOIN carts cart ON o.cart_id = cart.cart_id
      JOIN customers c ON cart.customer_id = c.customer_id
      JOIN cart_items ci ON cart.cart_id = ci.cart_id
      WHERE o.order_status = 'delivered' ${dateFilter}
      GROUP BY o.order_id, o.order_date, o.total_amount, o.order_status, c.name
      ORDER BY o.order_date DESC
      LIMIT 10
    `);
    console.log('Recent orders query result:', recentOrdersQuery.rows);

    // Convert string values to numbers for proper chart display
    const processedSalesData = salesDataQuery.rows.map(row => ({
      ...row,
      total_orders: parseInt(row.total_orders),
      total_revenue: parseFloat(row.total_revenue),
      total_discounts: parseFloat(row.total_discounts),
      total_delivery_fees: parseFloat(row.total_delivery_fees)
    }));

    const processedTopProducts = topProductsQuery.rows.map(row => ({
      ...row,
      times_purchased: parseInt(row.times_purchased),
      total_revenue: parseFloat(row.total_revenue)
    }));

    const processedCategorySales = categorySalesQuery.rows.map(row => ({
      ...row,
      orders_count: parseInt(row.orders_count),
      category_revenue: parseFloat(row.category_revenue)
    }));

    const processedOverallStats = {
      total_orders: parseInt(overallStatsQuery.rows[0].total_orders),
      total_revenue: parseFloat(overallStatsQuery.rows[0].total_revenue),
      avg_order_value: parseFloat(overallStatsQuery.rows[0].avg_order_value),
      unique_customers: parseInt(overallStatsQuery.rows[0].unique_customers),
      total_discounts: parseFloat(overallStatsQuery.rows[0].total_discounts),
      total_delivery_fees: parseFloat(overallStatsQuery.rows[0].total_delivery_fees)
    };

    const processedRecentOrders = recentOrdersQuery.rows.map(row => ({
      ...row,
      total_amount: parseFloat(row.total_amount),
      items_count: parseInt(row.items_count)
    }));

    const result = {
      period,
      salesData: processedSalesData,
      topProducts: processedTopProducts,
      categorySales: processedCategorySales,
      overallStats: processedOverallStats,
      recentOrders: processedRecentOrders
    };

    console.log('Final sales report data being sent:', result);
    res.json(result);
  } catch (err) {
    console.error('Error fetching sales report:', err);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};
