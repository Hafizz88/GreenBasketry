import { client } from "../db.js";
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
const getAllCategories = async (req, res) => {
  try {
    const categoryQuery = await client.query(
      `SELECT DISTINCT category FROM products`
    );
    res.status(200).json(categoryQuery.rows.map(row => row.category));
    console.log('📂 Categories fetched successfully:', categoryQuery.rows.length);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
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
export const getTopSellingProducts = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
         p.product_id, 
         p.name, 
         p.price, 
         p.image_url, 
         COALESCE(SUM(bh.times_purchased), 0) AS total_sold
       FROM products p
       LEFT JOIN buy_history bh ON p.product_id = bh.product_id
       GROUP BY p.product_id, p.name, p.price, p.image_url
       ORDER BY total_sold DESC
       LIMIT 12;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top selling products' });
  }
};

export { getAllProducts, getAllCategories, getProductsByCategory, SearchProductByname };
