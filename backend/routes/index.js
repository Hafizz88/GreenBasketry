const express = require('express');
const router = express.Router();
const pool = require('../db'); // go up one level

// Route to get all products
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;

