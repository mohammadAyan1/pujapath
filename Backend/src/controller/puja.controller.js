import { convertTo24Hour } from "../utils/convertTo24Hour.js";
import db from "../utils/db.js";
import { getPagination } from "../utils/pagination.js";
import fs from "fs"

// export const createPuja = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const {
//       temple_id,
//       puja_category_id,
//       name,
//       price,
//       duration_minutes,
//       slot,
//       puja_date,
//       start_time,
//       description
//     } = req.body;

//     const timeInA24Hours = convertTo24Hour(start_time);
//     // ✅ Multer file path
//     const image = req.file ? req.file.path : null;

//     if (
//       !temple_id ||
//       !puja_category_id ||
//       !name ||
//       !price ||
//       !duration_minutes ||
//       !slot ||
//       !description
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     await connection.beginTransaction();

//     // Check for duplicate active puja name in same temple and category
//     const [existing] = await connection.execute(
//       `SELECT id FROM puja 
//        WHERE temple_id = ? 
//        AND puja_category_id = ? 
//        AND name = ? 
//        AND status = 'active'`,
//       [temple_id, puja_category_id, name.trim()]
//     );

//     if (existing.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message:
//           "Puja with this name already exists in this temple and category",
//       });
//     }

//     const insertQuery = `
//       INSERT INTO puja 
//       (temple_id, puja_category_id, name, price, duration, slot, puja_date, start_time, status,image,description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active',?,?)
//     `;

//     await connection.execute(insertQuery, [
//       temple_id,
//       puja_category_id,
//       name.trim(),
//       price,
//       duration_minutes,
//       slot,
//       puja_date || null,
//       timeInA24Hours,
//       image,
//       description

//     ]);

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Puja created successfully",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Create Puja Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create puja",
//     });
//   } finally {
//     connection.release();
//   }
// };

export const createPuja = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied: Admin only" });
  }

  const connection = await db.promise().getConnection();

  try {
    const {
      temple_id,
      puja_category_id,
      name,
      price,
      duration_minutes,
      slot,
      puja_date,
      start_time,
      description,

      // ✅ NEW
      schedule_type,
      schedule_days,
    } = req.body;

    const timeInA24Hours = convertTo24Hour(start_time);
    const image = req.file ? req.file.path : null;

    if (!temple_id || !puja_category_id || !name || !price || !duration_minutes || !slot || !description) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    // ✅ validate schedule_type
    const scheduleType = schedule_type || "date";
    if (!["date", "daily", "weekly"].includes(scheduleType)) {
      return res.status(400).json({ success: false, message: "Invalid schedule_type" });
    }

    // ✅ validate days
    let daysArray = [];
    if (scheduleType === "weekly") {
      try {
        daysArray = schedule_days ? JSON.parse(schedule_days) : [];
      } catch {
        return res.status(400).json({ success: false, message: "schedule_days must be valid JSON array" });
      }

      const allowed = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const ok =
        Array.isArray(daysArray) &&
        daysArray.length > 0 &&
        daysArray.every((d) => allowed.includes(d));

      if (!ok) {
        return res.status(400).json({
          success: false,
          message: "schedule_days must contain days like ['mon','wed']",
        });
      }
    }

    // ✅ for date type puja_date required
    if (scheduleType === "date" && !puja_date) {
      return res.status(400).json({
        success: false,
        message: "puja_date is required when schedule_type is 'date'",
      });
    }

    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO puja
      (
        temple_id, puja_category_id, name, price, duration, slot,
        puja_date, start_time, status, image, description,
        schedule_type, schedule_days
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      temple_id,
      puja_category_id,
      name.trim(),
      price,
      duration_minutes,
      slot,
      scheduleType === "date" ? puja_date : null,
      timeInA24Hours,
      image,
      description,
      scheduleType,
      scheduleType === "weekly" ? JSON.stringify(daysArray) : null,
    ]);

    await connection.commit();

    return res.status(201).json({ success: true, message: "Puja created successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Create Puja Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create puja" });
  } finally {
    connection.release();
  }
};


export const getAllPuja = async (req, res) => {
  const connection = db.promise();

  try {
    const { status, temple_id } = req.query;
    const { page, limit, offset, category, sortBy } = getPagination(req);

    let whereQuery = `WHERE 1=1`;
    const whereParams = [];

    // ✅ status filter
    if (status && (status === "active" || status === "inactive")) {
      whereQuery += ` AND p.status = ?`;
      whereParams.push(status);
    }

    // ✅ filter by temple_id
    if (temple_id && !isNaN(Number(temple_id))) {
      whereQuery += ` AND p.temple_id = ?`;
      whereParams.push(Number(temple_id));
    }

    // ✅ filter by puja category
    if (!Number.isNaN(category) && category) {
      whereQuery += ` AND p.puja_category_id = ?`;
      whereParams.push(category);
    }

    // ✅ only active category
    whereQuery += ` AND pc.status = 'active'`;

    // ✅ ORDER BY logic
    let orderByQuery = `ORDER BY p.created_at DESC`;

    if (sortBy === "price_low") {
      orderByQuery = `ORDER BY p.price ASC`;
    } else if (sortBy === "price_high") {
      orderByQuery = `ORDER BY p.price DESC`;
    } else if (sortBy === "latest") {
      orderByQuery = `ORDER BY p.created_at DESC`;
    }

    // ✅ Total count
    const [totalRows] = await connection.execute(
      `
      SELECT COUNT(*) as total
      FROM puja p
      LEFT JOIN puja_category pc ON p.puja_category_id = pc.id
      ${whereQuery}
      `,
      whereParams
    );

    const total = totalRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ Paginated data
    const [rows] = await connection.execute(
      `
      SELECT 
        p.*,
        t.name as temple_name,
        t.city as temple_city,
        t.state as temple_state,
        pc.name as category_name,
        pc.description as puja_category_description
      FROM puja p
      LEFT JOIN temples t ON p.temple_id = t.id
      LEFT JOIN puja_category pc ON p.puja_category_id = pc.id
      ${whereQuery}
      ${orderByQuery}
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
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Puja Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch puja",
    });
  }
};

// export const updatePuja = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const {
//       temple_id,
//       puja_category_id,
//       name,
//       price,
//       duration_minutes,
//       slot,
//       puja_date,
//       start_time,
//       status,
//       description
//     } = req.body;
//     const { id } = req.params;

//     if (!id || isNaN(parseInt(id))) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid puja ID is required",
//       });
//     }

//     if (
//       !temple_id ||
//       !puja_category_id ||
//       !name ||
//       !price ||
//       !duration_minutes ||
//       !slot ||
//       !description
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     // Validate status if provided
//     if (status && !["active", "inactive"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Status must be either 'active' or 'inactive'",
//       });
//     }

//     const timeInA24Hours = convertTo24Hour(start_time);

//     await connection.beginTransaction();

//     // First, check if puja exists
//     const [checkRows] = await connection.execute(
//       "SELECT * FROM puja WHERE id = ?",
//       [id]
//     );

//     if (checkRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Puja not found",
//       });
//     }

//     const currentPuja = checkRows[0];

//     // Check for duplicate name ONLY IF name is being changed AND puja is active
//     if (
//       (name.trim() !== currentPuja.name ||
//         temple_id != currentPuja.temple_id ||
//         puja_category_id != currentPuja.puja_category_id) &&
//       status !== "inactive"
//     ) {
//       // Check for duplicate active puja name in same temple and category
//       const [duplicateRows] = await connection.execute(
//         `SELECT id FROM puja 
//          WHERE temple_id = ? 
//          AND puja_category_id = ? 
//          AND name = ? 
//          AND status = 'active' 
//          AND id != ?`,
//         [temple_id, puja_category_id, name.trim(), id]
//       );

//       if (duplicateRows.length > 0) {
//         await connection.rollback();
//         return res.status(400).json({
//           success: false,
//           message:
//             "Puja with this name already exists in this temple and category",
//         });
//       }
//     }


//     // ✅ if new image uploaded
//     let newImagePath = currentPuja.image;
//     if (req.file) {
//       newImagePath = req.file.path;

//       // ✅ delete old image file
//       if (currentPuja.image && fs.existsSync(currentPuja.image)) {
//         fs.unlinkSync(currentPuja.image);
//       }
//     }

//     const updateQuery = `
//       UPDATE puja
//       SET
//         temple_id = ?,
//         puja_category_id = ?,
//         name = ?,
//         image = ?,
//         price = ?,
//         duration = ?,
//         slot = ?,
//         puja_date = ?,
//         start_time = ?,
//         status = ?,
//         description=?,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `;

//     const [result] = await connection.execute(updateQuery, [
//       temple_id,
//       puja_category_id,
//       name.trim(),
//       newImagePath, // ✅ update image
//       price,
//       duration_minutes,
//       slot,
//       puja_date || null,
//       timeInA24Hours,
//       status || "active",
//       description,
//       id,
//     ]);

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Puja not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Puja updated successfully",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Update Puja Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update puja",
//     });
//   } finally {
//     connection.release();
//   }
// };

export const updatePuja = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied: Admin only" });
  }

  const connection = await db.promise().getConnection();

  try {
    const {
      temple_id,
      puja_category_id,
      name,
      price,
      duration_minutes,
      slot,
      puja_date,
      start_time,
      status,
      description,

      // ✅ NEW
      schedule_type,
      schedule_days,
    } = req.body;

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Valid puja ID is required" });
    }

    if (!temple_id || !puja_category_id || !name || !price || !duration_minutes || !slot || !description) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    const scheduleType = schedule_type || "date";
    if (!["date", "daily", "weekly"].includes(scheduleType)) {
      return res.status(400).json({ success: false, message: "Invalid schedule_type" });
    }

    let daysArray = [];
    if (scheduleType === "weekly") {
      try {
        daysArray = schedule_days ? JSON.parse(schedule_days) : [];
      } catch {
        return res.status(400).json({ success: false, message: "schedule_days must be valid JSON array" });
      }

      const allowed = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const ok =
        Array.isArray(daysArray) &&
        daysArray.length > 0 &&
        daysArray.every((d) => allowed.includes(d));

      if (!ok) {
        return res.status(400).json({
          success: false,
          message: "schedule_days must contain days like ['mon','wed']",
        });
      }
    }

    if (scheduleType === "date" && !puja_date) {
      return res.status(400).json({
        success: false,
        message: "puja_date is required when schedule_type is 'date'",
      });
    }

    const timeInA24Hours = convertTo24Hour(start_time);

    await connection.beginTransaction();

    const [checkRows] = await connection.execute("SELECT * FROM puja WHERE id = ?", [id]);
    if (!checkRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Puja not found" });
    }

    const currentPuja = checkRows[0];

    // ✅ image handling
    let newImagePath = currentPuja.image;
    if (req.file) {
      newImagePath = req.file.path;
      if (currentPuja.image && fs.existsSync(currentPuja.image)) {
        fs.unlinkSync(currentPuja.image);
      }
    }

    const updateQuery = `
      UPDATE puja
      SET
        temple_id = ?,
        puja_category_id = ?,
        name = ?,
        image = ?,
        price = ?,
        duration = ?,
        slot = ?,
        puja_date = ?,
        start_time = ?,
        status = ?,
        description = ?,
        schedule_type = ?,
        schedule_days = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [
      temple_id,
      puja_category_id,
      name.trim(),
      newImagePath,
      price,
      duration_minutes,
      slot,
      scheduleType === "date" ? puja_date : null,
      timeInA24Hours,
      status || "active",
      description,
      scheduleType,
      scheduleType === "weekly" ? JSON.stringify(daysArray) : null,
      id,
    ]);

    await connection.commit();

    return res.status(200).json({ success: true, message: "Puja updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update Puja Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update puja" });
  } finally {
    connection.release();
  }
};

export const deletePuja = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid puja ID is required",
      });
    }

    await connection.beginTransaction();

    // First, check if puja exists
    const [checkRows] = await connection.execute(
      "SELECT id FROM puja WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja not found",
      });
    }

    const updateQuery = `
      UPDATE puja
      SET status = 'inactive',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Failed to delete puja",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Puja deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete Puja Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete puja",
    });
  } finally {
    connection.release();
  }
};

export const updatePujaStatus = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }



  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid puja ID is required",
      });
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required",
      });
    }

    await connection.beginTransaction();

    // First, check if puja exists and get current data
    const [checkRows] = await connection.execute(
      "SELECT id, temple_id, puja_category_id, name, status FROM puja WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja not found",
      });
    }

    const puja = checkRows[0];

    // If activating a puja, check for duplicate active puja in same temple and category
    if (status === "active" && puja.status === "inactive") {
      const [duplicateRows] = await connection.execute(
        `SELECT id FROM puja 
         WHERE temple_id = ? 
         AND puja_category_id = ? 
         AND name = ? 
         AND status = 'active' 
         AND id != ?`,
        [puja.temple_id, puja.puja_category_id, puja.name, id]
      );

      if (duplicateRows.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Cannot activate: Another active puja with the same name exists in this temple and category",
        });
      }
    }

    const updateQuery = `
      UPDATE puja
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [status, id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Failed to update puja status",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Puja ${status === "active" ? "activated" : "deactivated"
        } successfully`,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update Puja Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update puja status",
    });
  } finally {
    connection.release();
  }
};

export const getPujaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.promise().execute(
      "SELECT * FROM puja WHERE id=? AND status='active'",
      [id]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
