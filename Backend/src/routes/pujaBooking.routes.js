// import express from "express";
// import {
//   createPujaBooking,
//   getAllPujaBookingByUser,
// } from "../controller/pujaBooking.controller.js";
// import { isAuthenticated } from "../middelware/auth.middleware.js";
// const pujaBookRoutes = express.Router();

// pujaBookRoutes.post("/", isAuthenticated, createPujaBooking);
// pujaBookRoutes.get("/", isAuthenticated, getAllPujaBookingByUser);

// export default pujaBookRoutes;


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

