import jwt from "jsonwebtoken";
import db from "../utils/db.js";

export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        // ✅ Guest allowed
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await db
            .promise()
            .execute(`SELECT id, name, email, role FROM users WHERE id = ?`, [
                decoded.id,
            ]);

        if (!rows.length) {
            req.user = null;
            return next();
        }

        req.user = rows[0];
        next();
    } catch (error) {
        // ✅ If token invalid, treat as guest (don’t block)
        req.user = null;
        next();
    }
};
