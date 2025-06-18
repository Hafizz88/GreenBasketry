import { client } from '../db.js';

export const addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [userId, productId, quantity || 1]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding to cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCartItems = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query(
      `SELECT c.*, p.name, p.price, p.image_url 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.product_id 
       WHERE c.user_id = $1`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeFromCart = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    await client.query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
    res.status(200).json({ message: 'Removed from cart' });
  } catch (err) {
    console.error('❌ Error removing from cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
export const updateCartItem = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const result = await client.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE user_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, userId, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating cart item:', err);33
    res.status(500).json({ error: 'Server error' });
  }
};

