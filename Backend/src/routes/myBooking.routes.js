import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import { getMyAllBookings } from "../controller/myBooking.controller.js";

const myBookingRoutes = express.Router();

// ✅ all bookings for logged in user
myBookingRoutes.get("/my", isAuthenticated, getMyAllBookings);

export default myBookingRoutes;
