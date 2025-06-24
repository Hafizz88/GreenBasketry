import { client } from '../db.js';

// Add a new product
export const addProduct = async (req, res) => {
  const { name, category, price, stock, description, image_url, discount_percentage, vat_percentage } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO products (name, category, price, stock, description, image_url, discount_percentage, vat_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, category, price, stock, description, image_url, discount_percentage, vat_percentage]
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
  const { code, description, discount_percent, valid_from, valid_to } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO coupons (code, description, discount_percent, valid_from, valid_to)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code, description, discount_percent, valid_from, valid_to]
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
    await client.query('DELETE FROM products WHERE product_id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Update all product fields (except id)
export const updateProduct = async (req, res) => {
  const { product_id, name, category, price, stock, description, image_url, discount_percentage, vat_percentage } = req.body;
  try {
    const result = await client.query(
      `UPDATE products SET name=$1, category=$2, price=$3, stock=$4, description=$5, image_url=$6, discount_percentage=$7, vat_percentage=$8 WHERE product_id=$9 RETURNING *`,
      [name, category, price, stock, description, image_url, discount_percentage, vat_percentage, product_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM coupons');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    await client.query('DELETE FROM coupons WHERE coupon_id = $1', [id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

// Update a coupon
export const updateCoupon = async (req, res) => {
  const { coupon_id, code, description, discount_percent, valid_from, valid_to, is_active } = req.body;
  try {
    const result = await client.query(
      `UPDATE coupons SET code=$1, description=$2, discount_percent=$3, valid_from=$4, valid_to=$5, is_active=$6 WHERE coupon_id=$7 RETURNING *`,
      [code, description, discount_percent, valid_from, valid_to, is_active, coupon_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};
