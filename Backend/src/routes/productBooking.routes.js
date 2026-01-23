import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
    createCODBooking,
    createRazorpayOrder,
    verifyRazorpayAndBook,
} from "../controller/productBooking.controller.js";

const productBookingRoutes = express.Router();

// ✅ COD Booking
productBookingRoutes.post("/cod", isAuthenticated, createCODBooking);

// ✅ Razorpay Order Create
productBookingRoutes.post("/razorpay/create-order", isAuthenticated, createRazorpayOrder);

// ✅ Razorpay Verify + Booking
productBookingRoutes.post("/razorpay/verify", isAuthenticated, verifyRazorpayAndBook);


export default productBookingRoutes;
