import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
    createCartCODBooking,
    createCartRazorpayOrder,
    verifyCartRazorpay,
} from "../controller/cartBooking.controller.js";

const cardBookingRoutes = express.Router();

cardBookingRoutes.post("/cod", isAuthenticated, createCartCODBooking);
cardBookingRoutes.post("/razorpay/create-order", isAuthenticated, createCartRazorpayOrder);
cardBookingRoutes.post("/razorpay/verify", isAuthenticated, verifyCartRazorpay);

export default cardBookingRoutes;
