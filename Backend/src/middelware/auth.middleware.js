import jwt from "jsonwebtoken";
import db from "../utils/db.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please Login First",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db
      .promise()
      .execute(`SELECT id, name, email, role FROM users WHERE id = ?`, [
        decoded.id,
      ]);

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
