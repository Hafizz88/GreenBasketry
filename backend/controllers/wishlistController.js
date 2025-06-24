import { client } from "../db.js";

// 📌 Utility function (unchanged)
async function addToWishlistHelper(customer_id, product_id) {
    const insertRes = await client.query(
        `INSERT INTO wishlist (customer_id, product_id) VALUES ($1, $2) RETURNING wishlist_id`,
        [customer_id, product_id]
    );
    if (insertRes.rowCount === 0) {
        throw new Error('Failed to add to wishlist');
    }
    return insertRes.rows[0].wishlist_id;
}

// ✅ Express controller for POST /api/wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { customer_id, product_id } = req.body;
        const wishlistId = await addToWishlistHelper(customer_id, product_id);
        res.status(200).json({ wishlist_id: wishlistId });
    } catch (error) {
        console.error('Error adding to wishlist:', error.message);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

// Similarly define and export the other two:
export const removeFromWishlist = async (req, res) => {
    try {
        const { customer_id, product_id } = req.body;
        const deleteRes = await client.query(
            `DELETE FROM wishlist WHERE customer_id = $1 AND product_id = $2 RETURNING *`,
            [customer_id, product_id]
        );
        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ error: 'No wishlist item found to delete' });
        }
        res.status(200).json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error.message);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
};

export const getWishlist = async (req, res) => {
    try {
        console.log('Fetching wishlist for customer:', req.query.customer_id);
        const { customer_id } = req.query;
        const result = await client.query(
            `SELECT w.wishlist_id, w.product_id, p.name, p.price 
             FROM wishlist w 
             JOIN products p ON w.product_id = p.product_id 
             WHERE w.customer_id = $1`,
            [customer_id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching wishlist:', error.message);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};
