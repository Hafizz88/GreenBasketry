// controllers/thanaController.js

import { client } from '../db.js';

export const getAllThanas = async (req, res) => {
  try {
    const result = await client.query('SELECT id, thana_name FROM "Thanas" ORDER BY thana_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching thanas:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

