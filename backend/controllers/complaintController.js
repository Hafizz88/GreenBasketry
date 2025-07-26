import { client } from "../db.js";

export const getAllComplaints = async (req, res) => {
  try {
    const { rows } = await client.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getComplaintsByCustomer = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const { rows } = await client.query(
      'SELECT * FROM complaints WHERE customer_id = $1 ORDER BY created_at DESC',
      [customer_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createComplaint = async (req, res) => {
  const { customer_id, complaint_text } = req.body;
  try {
    const { rows } = await client.query(
      'INSERT INTO complaints (customer_id, complaint_text) VALUES ($1, $2) RETURNING *',
      [customer_id, complaint_text]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resolveComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await client.query(
      'UPDATE complaints SET resolved = true WHERE complaint_id = $1 RETURNING *',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};