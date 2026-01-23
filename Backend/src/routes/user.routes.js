


import express from "express";
import {
  getAllUsers,
  updateUserApproved,
  updateUserVerified,
  updateUserRole,
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";

const userRoutes = express.Router();

// ✅ GET USERS WITH PAGINATION + SEARCH + FILTERS
userRoutes.get("/", isAuthenticated, getAllUsers);

// ✅ ADMIN ACTIONS
userRoutes.put("/approve/:id", isAuthenticated, updateUserApproved);
userRoutes.put("/verify/:id", isAuthenticated, updateUserVerified);
userRoutes.put("/role/:id", isAuthenticated, updateUserRole);

export default userRoutes;
