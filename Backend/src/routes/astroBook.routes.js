import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  createAstroBooking,
  getAllAstroBookinByUser,
} from "../controller/astroBook.controller.js";
const astroBookRoutes = express.Router();

astroBookRoutes.post("/", isAuthenticated, createAstroBooking);
astroBookRoutes.get("/", isAuthenticated, getAllAstroBookinByUser);

export default astroBookRoutes;
