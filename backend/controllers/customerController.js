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



