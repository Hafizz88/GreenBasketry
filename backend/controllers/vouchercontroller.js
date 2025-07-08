import { client } from "../db.js";
// 📌 Utility function to add a voucher
//export const showvouchers = async (req, res) => {

export const showVouchers = async (req, res) => {
  const { customer_id } = req.params;

  try {
    const result = await client.query(
      `SELECT * FROM get_cart_summary_with_vouchers($1)`,
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No cart summary available." });
    }

    const summary = result.rows[0];

    res.status(200).json({
      cart_id: summary.cart_id,
      subtotal: summary.subtotal,
      total_vat: summary.total_vat,
      total_discount: summary.total_discount,
      grand_total: summary.grand_total,
      delivery_fee: summary.delivery_fee,
      active_coupon_code: summary.active_coupon_code,
      active_coupon_discount: summary.active_coupon_discount
    });
  } catch (err) {
    console.error("Error in showVouchers:", err);
    res.status(500).json({ error: "Server error while fetching voucher/cart summary." });
  }
};
