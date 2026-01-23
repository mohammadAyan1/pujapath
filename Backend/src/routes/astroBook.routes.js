import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  createAstroRazorpayOrder,
  verifyAstroRazorpayAndBook,
} from "../controller/astroBook.controller.js";

const astroBookingRoutes = express.Router();

astroBookingRoutes.post(
  "/razorpay/create-order",
  isAuthenticated,
  createAstroRazorpayOrder
);

astroBookingRoutes.post(
  "/razorpay/verify",
  isAuthenticated,
  verifyAstroRazorpayAndBook
);

export default astroBookingRoutes;
