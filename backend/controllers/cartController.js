import { client } from '../db.js';

// Helper: Get or create active cart for a customer
async function getOrCreateActiveCart(customerId) {
  // Try to find active cart
  console.log('📩 getOrCreateActiveCart called with:', customerId);
  let res = await client.query(
    `SELECT * FROM carts WHERE customer_id = $1 AND is_active = true LIMIT 1`,
    [customerId]
  );
  if (res.rows.length > 0) return res.rows[0];

  // Create new cart if not found
  res = await client.query(
    `INSERT INTO carts (customer_id, is_active, price) VALUES ($1, true, 0) RETURNING *`,
    [customerId]
  );
  return res.rows[0];
}

// GET /api/cart?customer_id=1
export const getCart = async (req, res) => {
  const { customer_id } = req.query;
  try {
    const cart = await getOrCreateActiveCart(customer_id);
    // Get cart items with product info
    const itemsRes = await client.query(
      `SELECT ci.cart_item_id, ci.quantity, ci.added_at, 
              p.product_id, p.name, p.price, p.image_url
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = $1`,
      [cart.cart_id]
    );

    // Update the cart's total price
    const totalPrice = itemsRes.rows.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    await client.query(
      `UPDATE carts SET price = $1 WHERE cart_id = $2`,
      [totalPrice, cart.cart_id]
    );

    res.status(200).json({
      cart,
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('❌ Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/cart
export const addToCart = async (req, res) => {
  console.log('Add to cart called:', req.body);
  const { customer_id, product_id, quantity } = req.body;
  try {
    const cart = await getOrCreateActiveCart(customer_id);

    // Check if item already exists
    const existsRes = await client.query(
      `SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cart.cart_id, product_id]
    );
    let item;
    if (existsRes.rows.length > 0) {
      // Update quantity
      const updateRes = await client.query(
        `UPDATE cart_items SET quantity = quantity + $1 WHERE cart_id = $2 AND product_id = $3 RETURNING *`,
        [quantity || 1, cart.cart_id, product_id]
      );
      item = updateRes.rows[0];
    } else {
      // Insert new item
      const insertRes = await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
        [cart.cart_id, product_id, quantity || 1]
      );
      item = insertRes.rows[0];
    }

    // After adding item, recalculate the cart's total price
    const itemsRes = await client.query(
      `SELECT ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id = $1`,
      [cart.cart_id]
    );

    const totalPrice = itemsRes.rows.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Update the cart price
    await client.query(
      `UPDATE carts SET price = $1 WHERE cart_id = $2`,
      [totalPrice, cart.cart_id]
    );

    res.status(200).json(item);
  } catch (err) {
    console.error('❌ Error adding to cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/cart
export const removeFromCart = async (req, res) => {
  const { customer_id, product_id } = req.body;
  try {
    const cart = await getOrCreateActiveCart(customer_id);
    await client.query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cart.cart_id, product_id]
    );

    // After removal, recalculate the cart's total price
    const itemsRes = await client.query(
      `SELECT ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id = $1`,
      [cart.cart_id]
    );

    const totalPrice = itemsRes.rows.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Update the cart price
    await client.query(
      `UPDATE carts SET price = $1 WHERE cart_id = $2`,
      [totalPrice, cart.cart_id]
    );

    res.status(200).json({ message: 'Removed from cart' });
  } catch (err) {
    console.error('❌ Error removing from cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/cart
export const updateCartItem = async (req, res) => {
  const { customer_id, product_id, quantity } = req.body;
  try {
    const cart = await getOrCreateActiveCart(customer_id);
    const result = await client.query(
      `UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 RETURNING *`,
      [quantity, cart.cart_id, product_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // After updating, recalculate the cart's total price
    const itemsRes = await client.query(
      `SELECT ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id = $1`,
      [cart.cart_id]
    );

    const totalPrice = itemsRes.rows.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Update the cart price
    await client.query(
      `UPDATE carts SET price = $1 WHERE cart_id = $2`,
      [totalPrice, cart.cart_id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating cart item:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

