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

const authRoutes = express.Router();
authRoutes.get("/checkUserLogin", isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});
authRoutes.post("/login", login);
authRoutes.post("/logout", isAuthenticated, logout);
authRoutes.post("/register", register);
authRoutes.post("/verify", verifyEmail);
authRoutes.post("/resend", resendOTP);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);

authRoutes.post("/admin/register", isAuthenticated, adminRegister);

export default authRoutes;
