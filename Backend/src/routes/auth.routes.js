import express from "express";
import {
  login,
  register,
  resendOTP,
  verifyEmail,
  resetPassword,
  forgotPassword,
  logout,
  adminRegister

} from "../controller/auth.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import { authLimiter } from "../middelware/rateLimiter.js";

const authRoutes = express.Router();
authRoutes.get("/checkUserLogin", isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});
authRoutes.post("/login", authLimiter, login);
authRoutes.post("/logout", authLimiter, isAuthenticated, logout);
authRoutes.post("/register", authLimiter, register);
authRoutes.post("/verify", authLimiter, verifyEmail);
authRoutes.post("/resend", authLimiter, resendOTP);
authRoutes.post("/forgot-password", authLimiter, forgotPassword);
authRoutes.post("/reset-password", authLimiter, resetPassword);

authRoutes.post("/admin/register", authLimiter, isAuthenticated, adminRegister);

export default authRoutes;
