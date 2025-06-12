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

export { getAllProducts };
