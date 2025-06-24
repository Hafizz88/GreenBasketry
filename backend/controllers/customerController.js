import { client } from "../db.js";
// 📌 Utility function to add a customer 
export const getCustomerById = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const result = await client.query(
      `SELECT * FROM customers WHERE customer_id = $1`,
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Server error fetching customer' });
  }
};
export const getAddressesByCustomer = async (req, res) => {
  const { customer_id } = req.query;
  try {
    const result = await client.query(
      `SELECT * FROM addresses WHERE customer_id = $1`,
      [customer_id]
    );

    res.status(200).json(result.rows); // Can return []
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Server error fetching addresses' });
  }
};