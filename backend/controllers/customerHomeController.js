import { client } from "../db.js";

// Get customer's personalized home data
const getCustomerHomeData = async (req, res) => {
  const { customerId } = req.params;
  
  try {
    // Get customer's address and zone information
    const customerAddressQuery = await client.query(
      `SELECT a.address_id, a.address_line, a.zone_id, dz.zone_name, t.thana_name
       FROM addresses a
       JOIN delivery_zones dz ON a.zone_id = dz.zone_id
       LEFT JOIN "Thanas" t ON a.thana_id = t.id
       WHERE a.customer_id = $1 AND a.is_default = true
       LIMIT 1`,
      [customerId]
    );

    const customerZone = customerAddressQuery.rows[0]?.zone_name || 'Central Dhaka'; // Default zone

    // 1. Get customer's wishlist products
    const wishlistQuery = await client.query(
      `SELECT p.product_id, p.name, p.price, p.stock, p.description, p.image_url, 
              p.discount_percentage, p.points_rewarded, w.added_on
       FROM wishlist w
       JOIN products p ON w.product_id = p.product_id
       WHERE w.customer_id = $1 AND p.stock > 0
       ORDER BY w.added_on DESC
       LIMIT 6`,
      [customerId]
    );

    // 2. Get customer's previous order products
    const previousOrdersQuery = await client.query(
      `SELECT DISTINCT p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
              p.discount_percentage, p.points_rewarded, o.order_date
       FROM orders o
       JOIN carts c ON o.cart_id = c.cart_id
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE c.customer_id = $1 AND o.order_status = 'delivered' AND p.stock > 0
       ORDER BY o.order_date DESC
       LIMIT 6`,
      [customerId]
    );

    // 3. Get top selling products in customer's zone
    const topSellingQuery = await client.query(
      `SELECT p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
              p.discount_percentage, p.points_rewarded,
              COUNT(ci.cart_item_id) as times_ordered
       FROM products p
       JOIN cart_items ci ON p.product_id = ci.product_id
       JOIN carts c ON ci.cart_id = c.cart_id
       JOIN orders o ON c.cart_id = o.cart_id
       JOIN addresses a ON o.address_id = a.address_id
       JOIN delivery_zones dz ON a.zone_id = dz.zone_id
       WHERE dz.zone_name = $1 
         AND o.order_status = 'delivered'
         AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
         AND p.stock > 0
       GROUP BY p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
                p.discount_percentage, p.points_rewarded
       ORDER BY times_ordered DESC
       LIMIT 6`,
      [customerZone]
    );

    // 4. Get customer's recent orders summary
    const recentOrdersQuery = await client.query(
      `SELECT o.order_id, o.order_date, o.total_amount, o.order_status,
              COUNT(ci.cart_item_id) as item_count
       FROM orders o
       JOIN carts c ON o.cart_id = c.cart_id
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       WHERE c.customer_id = $1
       GROUP BY o.order_id, o.order_date, o.total_amount, o.order_status
       ORDER BY o.order_date DESC
       LIMIT 3`,
      [customerId]
    );

    // 5. Get customer's points and stats
    const customerStatsQuery = await client.query(
      `SELECT points_earned, points_used, 
              (SELECT COUNT(*) FROM orders o JOIN carts c ON o.cart_id = c.cart_id WHERE c.customer_id = $1) as total_orders,
              (SELECT COUNT(*) FROM wishlist WHERE customer_id = $1) as wishlist_count
       FROM customers 
       WHERE customer_id = $1`,
      [customerId]
    );

    res.status(200).json({
      customerZone,
      wishlist: wishlistQuery.rows,
      previousOrders: previousOrdersQuery.rows,
      topSellingInZone: topSellingQuery.rows,
      recentOrders: recentOrdersQuery.rows,
      customerStats: customerStatsQuery.rows[0] || { points_earned: 0, points_used: 0, total_orders: 0, wishlist_count: 0 }
    });

    console.log(`🏠 Customer home data fetched for customer ${customerId} in zone ${customerZone}`);
  } catch (error) {
    console.error('Error fetching customer home data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer's wishlist
const getCustomerWishlist = async (req, res) => {
  const { customerId } = req.params;
  
  try {
    const wishlistQuery = await client.query(
      `SELECT p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
              p.discount_percentage, p.points_rewarded, w.added_on
       FROM wishlist w
       JOIN products p ON w.product_id = p.product_id
       WHERE w.customer_id = $1
       ORDER BY w.added_on DESC`,
      [customerId]
    );

    res.status(200).json(wishlistQuery.rows);
    console.log(`📋 Wishlist fetched for customer ${customerId}: ${wishlistQuery.rows.length} items`);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer's order history
const getCustomerOrderHistory = async (req, res) => {
  const { customerId } = req.params;
  
  try {
    const orderHistoryQuery = await client.query(
      `SELECT o.order_id, o.order_date, o.total_amount, o.order_status, o.payment_status,
              COUNT(ci.cart_item_id) as item_count,
              STRING_AGG(p.name, ', ') as product_names
       FROM orders o
       JOIN carts c ON o.cart_id = c.cart_id
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE c.customer_id = $1
       GROUP BY o.order_id, o.order_date, o.total_amount, o.order_status, o.payment_status
       ORDER BY o.order_date DESC`,
      [customerId]
    );

    res.status(200).json(orderHistoryQuery.rows);
    console.log(`📦 Order history fetched for customer ${customerId}: ${orderHistoryQuery.rows.length} orders`);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top selling products by zone
const getTopSellingByZone = async (req, res) => {
  const { zoneName } = req.params;
  
  try {
    const topSellingQuery = await client.query(
      `SELECT p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
              p.discount_percentage, p.points_rewarded,
              COUNT(ci.cart_item_id) as times_ordered,
              AVG(pr.rating) as avg_rating,
              COUNT(pr.review_id) as review_count
       FROM products p
       JOIN cart_items ci ON p.product_id = ci.product_id
       JOIN carts c ON ci.cart_id = c.cart_id
       JOIN orders o ON c.cart_id = o.cart_id
       JOIN addresses a ON o.address_id = a.address_id
       JOIN delivery_zones dz ON a.zone_id = dz.zone_id
       LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
       WHERE dz.zone_name = $1 
         AND o.order_status = 'delivered'
         AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
         AND p.stock > 0
       GROUP BY p.product_id, p.name, p.price, p.stock, p.description, p.image_url,
                p.discount_percentage, p.points_rewarded
       ORDER BY times_ordered DESC, avg_rating DESC
       LIMIT 12`,
      [zoneName]
    );

    res.status(200).json(topSellingQuery.rows);
    console.log(`🔥 Top selling products fetched for zone ${zoneName}: ${topSellingQuery.rows.length} products`);
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  getCustomerHomeData,
  getCustomerWishlist,
  getCustomerOrderHistory,
  getTopSellingByZone
}; 