import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import { getMyBookings, getBookingDetails } from "../controller/myBooking.controller.js";

const myBookingRoutes = express.Router();

// ✅ all bookings for logged in user
myBookingRoutes.get("/my", isAuthenticated, getMyBookings);
myBookingRoutes.get("/details/:type/:id", isAuthenticated, getBookingDetails);

export default myBookingRoutes;
