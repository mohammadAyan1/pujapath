

import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  createPujaRazorpayOrder,
  verifyPujaRazorpayAndBook,
} from "../controller/pujaBooking.controller.js";

const pujaBookingRoutes = express.Router();

pujaBookingRoutes.post(
  "/razorpay/create-order",
  isAuthenticated,
  createPujaRazorpayOrder
);

pujaBookingRoutes.post(
  "/razorpay/verify",
  isAuthenticated,
  verifyPujaRazorpayAndBook
);

export default pujaBookingRoutes;

