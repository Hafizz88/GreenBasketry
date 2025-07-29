import { client } from "../db.js";
import { uploadImageToCloudinary } from '../controllers/cloudinaryController.js';

// Create product with image upload to Cloudinary
const createProduct = async (req, res) => {
  const { name, description, price, quantity, categoryid, category } = req.body;
  let imageUrl = null;

  try {
    // Upload image if present
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer); // Handle image upload
    }

    // Normalize category: trim whitespace
    const normalizedCategory = category ? category.trim() : null;

    // Insert product into the database
    const result = await client.query(
      `INSERT INTO products (name, description, price, quantity, categoryid, category, image_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING product_id`,
      [name, description, price, quantity, categoryid, normalizedCategory, imageUrl]
    );

    res.status(201).json({ message: "Product created successfully", product: result.rows[0] });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch all products
const getAllProducts = async (req, res) => {
  try {
    const productQuery = await client.query(
      `SELECT * FROM products WHERE stock > 0 ORDER BY created_at DESC`
    );
    res.status(200).json(productQuery.rows);
    console.log('📦 Products fetched successfully:', productQuery.rows.length);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch all categories
const getAllCategories = async (req, res) => {
  try {
    const categoryQuery = await client.query(
      `SELECT DISTINCT category FROM products`
    );
    const categories = categoryQuery.rows.map(row => row.category);
    console.log('Categories sent to frontend:', categories);
    res.status(200).json(categories);
    console.log('📂 Categories fetched successfully:', categoryQuery.rows.length);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch products by category
const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const productQuery = await client.query(
      `SELECT * FROM products WHERE category = $1 AND stock > 0 ORDER BY created_at DESC`,
      [category]
    );
    res.status(200).json(productQuery.rows);
    console.log(`📦 Products in category "${category}" fetched successfully:`, productQuery.rows.length);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search products by name
const SearchProductByname = async (req, res) => {
  const { name } = req.query;
  try {
    const productQuery = await client.query(
      `SELECT * FROM products WHERE name ILIKE $1 AND stock > 0 ORDER BY created_at DESC`,
      [`%${name}%`]
    );
    res.status(200).json(productQuery.rows);
    console.log(`🔍 Products matching "${name}" fetched successfully:`, productQuery.rows.length);
  } catch (error) {
    console.error('Error fetching products by name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top selling products
const getTopSellingProducts = async (req, res) => {
  const { limit = 10 } = req.query;
  try {
    const topSellingQuery = await client.query(
      `SELECT 
        p.product_id,
        p.name,
        p.price,
        p.image_url,
        p.category,
        p.stock,
        p.description,
        p.vat_percentage,
        p.discount_percentage,
        p.discount_started,
        p.discount_finished,
        p.points_rewarded,
        COUNT(DISTINCT bh.customer_id) as total_customers,
        SUM(bh.times_purchased) as total_times_purchased,
        SUM(bh.times_purchased * p.price) as total_revenue,
        MAX(bh.last_purchased) as last_sold_date
      FROM products p
      LEFT JOIN buy_history bh ON p.product_id = bh.product_id
      WHERE p.stock > 0 
      GROUP BY p.product_id, p.name, p.price, p.image_url, p.category, p.stock, 
               p.description, p.vat_percentage, p.discount_percentage, 
               p.discount_started, p.discount_finished, p.points_rewarded
      ORDER BY total_times_purchased DESC NULLS LAST, total_customers DESC NULLS LAST
      LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.status(200).json(topSellingQuery.rows);
    console.log(`🔥 Top selling products fetched successfully:`, topSellingQuery.rows.length);
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top selling products by category
const getTopSellingByCategory = async (req, res) => {
  const { category } = req.params;
  const { limit = 5 } = req.query;
  
  try {
    const topSellingQuery = await client.query(
      `SELECT 
        p.product_id,
        p.name,
        p.price,
        p.image_url,
        p.category,
        p.stock,
        p.description,
        p.vat_percentage,
        p.discount_percentage,
        p.discount_started,
        p.discount_finished,
        p.points_rewarded,
        COUNT(DISTINCT bh.customer_id) as total_customers,
        SUM(bh.times_purchased) as total_times_purchased,
        SUM(bh.times_purchased * p.price) as total_revenue,
        MAX(bh.last_purchased) as last_sold_date
      FROM products p
      INNER JOIN buy_history bh ON p.product_id = bh.product_id
      WHERE p.stock > 0 
        AND p.category = $1
      GROUP BY p.product_id, p.name, p.price, p.image_url, p.category, p.stock, 
               p.description, p.vat_percentage, p.discount_percentage, 
               p.discount_started, p.discount_finished, p.points_rewarded
      ORDER BY total_times_purchased DESC, total_customers DESC
      LIMIT $2`,
      [category, parseInt(limit)]
    );
    
    res.status(200).json(topSellingQuery.rows);
    console.log(`🔥 Top selling products in category "${category}" fetched successfully:`, topSellingQuery.rows.length);
  } catch (error) {
    console.error('Error fetching top selling products by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get product details by ID
const getProductDetails = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch product info
    const productRes = await client.query(
      `SELECT product_id, name, category, price, stock, description, image_url, discount_percentage, vat_percentage, points_rewarded, created_at, last_updated
       FROM products WHERE product_id = $1`,
      [id]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Placeholder for reviews (future)
    // const reviewsRes = await client.query('SELECT ... FROM product_reviews WHERE product_id = $1', [id]);
    res.status(200).json({
      ...productRes.rows[0],
      reviews: [] // Placeholder for future reviews
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

// Add a product review
const addProductReview = async (req, res) => {
  const { product_id } = req.params;
  const customer_id = req.user && req.user.id;
  const { rating, review_text } = req.body;

  if (!customer_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!rating || !review_text) {
    return res.status(400).json({ error: 'Rating and review text are required' });
  }

  try {
    const result = await client.query(
      `INSERT INTO product_reviews (product_id, customer_id, rating, review_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id, customer_id, rating, review_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// Upvote a review
const upvoteReview = async (req, res) => {
  const { review_id } = req.params;
  const customer_id = req.user && req.user.id;

  if (!customer_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Prevent duplicate upvotes
    const existing = await client.query(
      `SELECT * FROM review_upvotes WHERE review_id = $1 AND customer_id = $2`,
      [review_id, customer_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already upvoted' });
    }

    const result = await client.query(
      `INSERT INTO review_upvotes (review_id, customer_id) VALUES ($1, $2) RETURNING *`,
      [review_id, customer_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error upvoting review:', err);
    res.status(500).json({ error: 'Failed to upvote review' });
  }
};

// Get reviews with upvote count
const getProductReviews = async (req, res) => {
  const { product_id } = req.params;
  try {
    const result = await client.query(
      `SELECT r.*, 
              COALESCE(COUNT(u.upvote_id), 0) AS upvotes
         FROM product_reviews r
         LEFT JOIN review_upvotes u ON r.review_id = u.review_id
        WHERE r.product_id = $1
        GROUP BY r.review_id
        ORDER BY r.created_at DESC`,
      [product_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export { 
  getAllProducts, 
  getAllCategories, 
  getProductsByCategory, 
  SearchProductByname,
  getTopSellingProducts,
  getTopSellingByCategory,
  createProduct, // Make sure to export createProduct
  getProductDetails, // Add the new function to the export
  addProductReview,
  upvoteReview,
  getProductReviews
};
