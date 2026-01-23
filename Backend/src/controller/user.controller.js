

import db from "../utils/db.js";



export const getAllUsers = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  try {
    let { page, limit, search, role, verified, approved } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    let whereQuery = "WHERE 1=1";
    const params = [];

    // ✅ search filter
    if (search && search.trim() !== "") {
      whereQuery += " AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)";
      const q = `%${search.trim()}%`;
      params.push(q, q, q);
    }

    // ✅ role filter
    if (role && role !== "all" && ["admin", "user"].includes(role)) {
      whereQuery += " AND role = ?";
      params.push(role);
    }

    // ✅ verified filter
    if (verified !== undefined && verified !== "all") {
      whereQuery += " AND is_verified = ?";
      params.push(Number(verified));
    }

    // ✅ approved filter
    if (approved !== undefined && approved !== "all") {
      whereQuery += " AND is_approved = ?";
      params.push(Number(approved));
    }

    // ✅ total count
    const [countRows] = await db.promise().execute(
      `SELECT COUNT(*) as total FROM users ${whereQuery}`,
      params
    );

    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ paginated data
    const [rows] = await db.promise().execute(
      `
      SELECT id, name, email, mobile, role, is_verified, is_approved, created_at, updated_at
      FROM users
      ${whereQuery}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      [...params]
    );

    return res.json({
      success: true,
      pagination: { page, limit, total, totalPages },
      data: rows,
    });
  } catch (error) {
    console.log("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ===========================
   UPDATE USER APPROVED
=========================== */
export const updateUserApproved = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = db.promise();

  try {
    const { id } = req.params;
    let { is_approved } = req.body;

    is_approved = Number(is_approved);

    if (![0, 1].includes(is_approved)) {
      return res.status(400).json({
        success: false,
        message: "is_approved must be 0 or 1",
      });
    }

    const [result] = await connection.execute(
      `UPDATE users SET is_approved=?, updated_at=NOW() WHERE id=?`,
      [is_approved, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: `User ${is_approved === 1 ? "Approved" : "Disapproved"} successfully`,
    });
  } catch (error) {
    console.error("updateUserApproved Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update approval",
    });
  }
};

/* ===========================
   UPDATE USER VERIFIED
=========================== */
export const updateUserVerified = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = db.promise();

  try {
    const { id } = req.params;
    let { is_verified } = req.body;

    is_verified = Number(is_verified);

    if (![0, 1].includes(is_verified)) {
      return res.status(400).json({
        success: false,
        message: "is_verified must be 0 or 1",
      });
    }

    const [result] = await connection.execute(
      `UPDATE users SET is_verified=?, updated_at=NOW() WHERE id=?`,
      [is_verified, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: `User ${is_verified === 1 ? "Verified" : "Unverified"} successfully`,
    });
  } catch (error) {
    console.error("updateUserVerified Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update verified",
    });
  }
};

/* ===========================
   UPDATE USER ROLE (admin/user)
=========================== */
export const updateUserRole = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = db.promise();

  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'admin' or 'user'",
      });
    }

    const [result] = await connection.execute(
      `UPDATE users SET role=?, updated_at=NOW() WHERE id=?`,
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("updateUserRole Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};
