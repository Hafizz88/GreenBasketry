import verifyToken from '../middleware/verifyToken.js';
import express from "express";
import { createComplaint, getAllComplaints, getComplaintsByCustomer, resolveComplaint } from "../controllers/complaintController.js";

const router = express.Router();

// Admin: get all complaints
router.get("/", verifyToken, getAllComplaints);
// Customer: get own complaints
router.get("/customer/:customer_id", verifyToken, getComplaintsByCustomer);
// Customer: submit complaint
router.post("/", verifyToken, createComplaint);
// Admin: resolve complaint
router.patch("/:id/resolve", verifyToken, resolveComplaint);

export default router;