import db from "../utils/db.js";
import { convertTo24Hour } from "../utils/convertTo24Hour.js";
import { getPagination } from "../utils/pagination.js";
import fs from "fs";
import path from "path";

export const createTemple = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();


  try {
    const {
      name,
      state,
      city,
      area,
      openingTime,
      closingTime,
      description,
      hasLive,
      liveLink,
      status = "active",
    } = req.body;

    const image = req.file ? req.file.path : null;

    if (!name || !state || !city || !openingTime || !closingTime) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const opening = convertTo24Hour(openingTime);
    const closing = convertTo24Hour(closingTime);

    // 🔐 Start transaction
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO temples 
      (
        name,
        state,
        city,
        area,
        opening_time,
        closing_time,
        description,
        has_live,
        live_url,
        image,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      name,
      state,
      city,
      area || null,
      opening,
      closing,
      description || null,
      hasLive ? 1 : 0,
      hasLive && liveLink ? liveLink : null,
      image,
      status,
    ]);

    // ✅ Commit if everything is fine
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Temple created successfully",
    });
  } catch (error) {
    // ❌ Rollback on error
    await connection.rollback();

    console.error("Create Temple Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create temple",
    });
  } finally {
    connection.release(); // ✅ MUST
  }
};



export const getAllTemple = async (req, res) => {
  const connection = db.promise();

  try {
    const { page, limit, offset } = getPagination(req);
    const { status, from_time, to_time } = req.query;

    let whereQuery = `WHERE 1=1`;
    const whereParams = [];

    // ✅ status filter
    if (status && ["active", "inactive"].includes(status)) {
      whereQuery += ` AND status = ?`;
      whereParams.push(status);
    } else {
      whereQuery += ` AND status = 'active'`;
    }

    // ✅ time range filter
    // opening_time and closing_time must be stored in TIME format (HH:mm:ss)
    if (from_time && to_time) {
      whereQuery += ` AND opening_time >= ? AND closing_time <= ?`;
      whereParams.push(from_time);
      whereParams.push(to_time);
    }

    // ✅ total count
    const [totalRows] = await connection.execute(
      `
      SELECT COUNT(*) as total 
      FROM temples
      ${whereQuery}
      `,
      whereParams
    );

    const total = totalRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ fetch paginated list
    const [rows] = await connection.execute(
      `
      SELECT *
      FROM temples
      ${whereQuery}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      whereParams
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Temple Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch temples",
    });
  }
};


export const updateTemple = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection(); // ✅


  try {
    const {
      name,
      state,
      city,
      area,
      openingTime,
      closingTime,
      description,
      hasLive,
      liveLink,
      status,
    } = req.body;

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Temple id is required",
      });
    }

    const opening = openingTime ? convertTo24Hour(openingTime) : null;
    const closing = closingTime ? convertTo24Hour(closingTime) : null;

    await connection.beginTransaction();

    const image = req.file ? req.file.path : null;

    // 🔴 Fetch old image if new image uploaded
    if (image) {
      const [rows] = await connection.execute(
        "SELECT image FROM temples WHERE id = ?",
        [id],
      );

      if (rows.length && rows[0].image) {
        const oldImagePath = path.join(
          process.cwd(),
          "uploads/temples",
          rows[0].image,
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Build dynamic update query based on provided fields
    let updateFields = [];
    let values = [];

    if (name) {
      updateFields.push("name = ?");
      values.push(name);
    }

    if (state) {
      updateFields.push("state = ?");
      values.push(state);
    }

    if (city) {
      updateFields.push("city = ?");
      values.push(city);
    }

    if (area !== undefined) {
      updateFields.push("area = ?");
      values.push(area || null);
    }

    if (opening) {
      updateFields.push("opening_time = ?");
      values.push(opening);
    }

    if (closing) {
      updateFields.push("closing_time = ?");
      values.push(closing);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      values.push(description || null);
    }

    if (hasLive !== undefined) {
      updateFields.push("has_live = ?");
      values.push(hasLive ? 1 : 0);
    }

    if (liveLink !== undefined) {
      updateFields.push("live_url = ?");
      values.push(hasLive ? liveLink : null);
    }

    if (status) {
      updateFields.push("status = ?");
      values.push(status);
    }

    if (image) {
      updateFields.push("image = ?");
      values.push(image);
    }

    if (updateFields.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(id); // For WHERE clause

    const updateQuery = `
      UPDATE temples
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, values);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Temple not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Temple updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Temple Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update temple",
    });
  } finally {
    connection.release(); // ✅ MUST
  }
};

export const deleteTemple = async (req, res) => {
  // ✅ Admin check
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Temple id is required",
      });
    }

    await connection.beginTransaction();

    // ✅ Check temple exists
    const [templeRows] = await connection.execute(
      "SELECT id, status FROM temples WHERE id = ?",
      [id]
    );

    if (templeRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Temple not found",
      });
    }

    // ✅ Soft delete (status inactive)
    const [result] = await connection.execute(
      `
      UPDATE temples
      SET status = 'inactive',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Temple not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Temple deactivated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Temple Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate temple",
    });
  } finally {
    connection.release();
  }
};
