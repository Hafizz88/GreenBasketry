import { client } from "../db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";

// Change customer password
export const changePassword = async (req, res) => {
  const { customer_id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  console.log('Changing password for customer ID:', customer_id);
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }
  
  try {
    // First, get the current customer to verify current password
    const customerResult = await client.query(
      `SELECT password_hash FROM customers WHERE customer_id = $1`,
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, customer.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update the password in database
    await client.query(
      `UPDATE customers SET password_hash = $1 WHERE customer_id = $2`,
      [hashedNewPassword, customer_id]
    );
    
    console.log('Password changed successfully for customer ID:', customer_id);
    
    res.status(200).json({ 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error while changing password' });
  }
};

// 📌 Utility function to add a customer 
// In customerController.js - Add better error handling
export const getCustomerById = async (req, res) => {
  const { customer_id } = req.params;
  
  console.log('Fetching customer with ID:', customer_id);
  
  if (!customer_id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }
  
  try {
    const result = await client.query(
      `SELECT * FROM customers WHERE customer_id = $1`,
      [customer_id]
    );

    console.log('Query result:', result.rows);

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
  const { customer_id } = req.params;
  console.log("Fetching addresses for customer_id:", customer_id);

  try {
    const result = await client.query(
      `
      SELECT 
        a.*, 
        t.thana_name
      FROM 
        addresses a
      JOIN 
        "Thanas" t ON a.thana_id = t.id
      WHERE 
        a.customer_id = $1
      `,
      [customer_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Server error fetching addresses' });
  }
};

/**
 * The function setAddressesByCustomer updates or inserts a new address for a customer based on the
 * provided data.
 * @param req - The `req` parameter in the `setAddressesByCustomer` function represents the request
 * object, which contains information about the HTTP request made to the server. This object typically
 * includes details such as the request headers, body, parameters, and other metadata related to the
 * request. In this specific function, `
 * @param res - The `res` parameter in the `setAddressesByCustomer` function is the response object
 * that will be used to send a response back to the client making the request. It is typically used to
 * set the status code and send data back to the client in the form of JSON or other formats. In
 * @returns The function `setAddressesByCustomer` is an asynchronous function that handles setting
 * addresses for a customer. It takes the request (`req`) and response (`res`) objects as parameters.
 */
 export const setAddressesByCustomer = async (req, res) => {
  const { customer_id, address_line, thana_name, postal_code } = req.body;
  console.log(customer_id,address_line, thana_name, postal_code);

  try {
    const result = await client.query(
      `SELECT * FROM upsert_customer_address($1, $2, $3, $4)`,
      [customer_id, address_line, thana_name, postal_code]
    );

    res.status(200).json({
      message: `Address ${result.rows[0].action} successfully`,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error setting address via procedure:', error);
    res.status(500).json({ error: error.message || 'Server error while setting address' });
  }
};

export const getAllCoupons = async (req, res) => {
  // Accept customer_id as query param
  const customer_id = req.query.customer_id;
  try {
    if (customer_id) {
      // Get available points for the customer
      const pointsRes = await client.query(
        `SELECT (COALESCE(points_earned, 0) - COALESCE(points_used, 0)) as available_points FROM customers WHERE customer_id = $1`,
        [customer_id]
      );
      const available_points = Number(pointsRes.rows[0]?.available_points) || 0;
      // Only return coupons the customer can afford
      const result = await client.query(
        'SELECT * FROM coupons WHERE is_active = true AND required_point <= $1',
        [available_points]
      );
      res.json(result.rows);
    } else {
      // Fallback: return all active coupons
      const result = await client.query('SELECT * FROM coupons WHERE is_active = true');
    res.json(result.rows);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};



