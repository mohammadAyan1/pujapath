// import db from "../utils/db.js";
// import fs from "fs";
// import { getPagination } from "../utils/pagination.js";
// export const createPandit = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const { name, expertise, experience, language, rating, temple_id, type } =
//       req.body;

//     const image = req.file ? req.file.path : null;

//     if (!name || !expertise || !experience || !language || !rating || !type) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     await connection.beginTransaction();

//     const insertQuery = `
//       INSERT INTO pandits
//       (name, image, temple_id, expertise, experience, language, rating,type)
//       VALUES (?, ?, ?, ?, ?, ?, ?,?)
//     `;

//     await connection.execute(insertQuery, [
//       name,
//       image,
//       temple_id,
//       expertise,
//       experience,
//       language,
//       rating,
//       type,
//     ]);

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Pandit created successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) { }

//     console.error("Create Pandit Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create Pandit",
//     });
//   } finally {
//     connection.release();
//   }
// };

// export const getAllPandit = async (req, res) => {
//   const connection = db.promise();

//   try {
//     const { page, limit, offset } = getPagination(req);

//     const { status, temple_id, expertise, type, sortby } = req.query;

//     let whereQuery = `WHERE 1=1`;
//     const whereParams = [];

//     // ✅ status filter
//     if (status && ["active", "inactive"].includes(status)) {
//       whereQuery += ` AND p.status = ?`;
//       whereParams.push(status);
//     } else {
//       // default active
//       whereQuery += ` AND p.status = 'active'`;
//     }

//     // ✅ temple filter
//     if (temple_id && !isNaN(Number(temple_id))) {
//       whereQuery += ` AND p.temple_id = ?`;
//       whereParams.push(Number(temple_id));
//     }

//     // ✅ expertise filter
//     if (expertise && expertise !== "all") {
//       whereQuery += ` AND p.expertise = ?`;
//       whereParams.push(expertise);
//     }

//     // ✅ type filter
//     if (type && ["astro", "pandit"].includes(type)) {
//       whereQuery += ` AND p.type = ?`;
//       whereParams.push(type);
//     }

//     // ✅ Sort
//     let orderByQuery = `ORDER BY p.created_at DESC`;

//     if (sortby === "rating_high") orderByQuery = `ORDER BY p.rating DESC`;
//     if (sortby === "rating_low") orderByQuery = `ORDER BY p.rating ASC`;
//     if (sortby === "exp_high") orderByQuery = `ORDER BY p.experience DESC`;
//     if (sortby === "exp_low") orderByQuery = `ORDER BY p.experience ASC`;
//     if (sortby === "latest") orderByQuery = `ORDER BY p.created_at DESC`;

//     // ✅ Total Count
//     const [totalRows] = await connection.execute(
//       `
//       SELECT COUNT(*) as total
//       FROM pandits p
//       ${whereQuery}
//       `,
//       whereParams
//     );

//     const total = totalRows[0]?.total || 0;
//     const totalPages = Math.ceil(total / limit);

//     // ✅ Paginated data with temple name (JOIN)
//     const [rows] = await connection.execute(
//       `
//       SELECT 
//         p.*,
//         t.name AS temple_name,
//         t.city AS temple_city,
//         t.state AS temple_state
//       FROM pandits p
//       LEFT JOIN temples t ON p.temple_id = t.id
//       ${whereQuery}
//       ${orderByQuery}
//       LIMIT ${limit} OFFSET ${offset}
//       `,
//       whereParams
//     );

//     return res.status(200).json({
//       success: true,
//       page,
//       limit,
//       total,
//       totalPages,
//       count: rows.length,
//       data: rows,
//     });
//   } catch (error) {
//     console.error("Get All Pandit Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch Pandits",
//     });
//   }
// };

// export const updatePandit = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const { id } = req.params;
//     const { name, expertise, experience, language, rating, temple_id, type } =
//       req.body;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Pandit id is required",
//       });
//     }

//     if (!name || !expertise || !experience || !language || !rating || !type) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     if (!["astro", "pandit"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid pandit type",
//       });
//     }

//     if (rating < 0 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Rating must be between 0 and 5",
//       });
//     }

//     // old image remove if new uploaded
//     let imageQuery = "";
//     let imageValue = [];

//     if (req.file) {
//       const [old] = await connection.execute(
//         "SELECT image FROM pandits WHERE id = ?",
//         [id]
//       );

//       if (old.length && old[0].image && fs.existsSync(old[0].image)) {
//         fs.unlinkSync(old[0].image);
//       }

//       imageQuery = ", image = ?";
//       imageValue.push(req.file.path);
//     }

//     await connection.beginTransaction();

//     const updateQuery = `
//       UPDATE pandits
//       SET
//         name = ?,
//         temple_id = ?,
//         expertise = ?,
//         experience = ?,
//         language = ?,
//         rating = ?,
//         type =?
//         ${imageQuery}
//       WHERE id = ? AND status = 'active'
//     `;

//     const [result] = await connection.execute(updateQuery, [
//       name,
//       temple_id,
//       expertise,
//       experience,
//       language,
//       rating,
//       type,
//       ...imageValue,
//       id,
//     ]);

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Pandit not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Pandit updated successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) { }

//     console.error("Update Pandit Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update Pandit",
//     });
//   } finally {
//     connection.release();
//   }
// };

// export const deletePandit = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Pandit id is required",
//       });
//     }

//     await connection.beginTransaction();

//     const [result] = await connection.execute(
//       `UPDATE pandits SET status = 'inactive' WHERE id = ? AND status = 'active'`,
//       [id]
//     );

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Pandit not found or already deleted",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Pandit deleted successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) { }

//     console.error("Delete Pandit Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete Pandit",
//     });
//   } finally {
//     connection.release();
//   }
// };

// export const updatePanditStatus = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Pandit id is required",
//       });
//     }

//     if (!status || !["active", "inactive"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid status (active/inactive) is required",
//       });
//     }

//     await connection.beginTransaction();

//     const [result] = await connection.execute(
//       `UPDATE pandits SET status = ? WHERE id = ?`,
//       [status, id]
//     );

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Pandit not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: `Pandit ${status === "active" ? "activated" : "deactivated"
//         } successfully`,
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) { }

//     console.error("Update Pandit Status Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update pandit status",
//     });
//   } finally {
//     connection.release();
//   }
// };



import db from "../utils/db.js";
import fs from "fs";
import { getPagination } from "../utils/pagination.js";

/* ================= CREATE PANDIT ================= */
export const createPandit = async (req, res) => {
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
      expertise,
      experience,
      language,
      rating,
      temple_id,
      type,

      is_free = 0,
      price_per_minute = null,
    } = req.body;

    const image = req.file ? req.file.path : null;

    if (!name || !expertise || !experience || !language || !rating || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // ✅ validate free/price
    const isFreeNum = Number(is_free) === 1 ? 1 : 0;

    let finalPrice = null;
    if (isFreeNum === 0) {
      const priceNum = Number(price_per_minute);
      if (!priceNum || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "price_per_minute must be > 0 for paid pandit",
        });
      }
      finalPrice = priceNum;
    }

    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO pandits
      (
        name, image, temple_id,
        expertise, experience, language, rating,
        status, is_available,
        type, is_free, price_per_minute
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      name,
      image,
      temple_id || null,
      expertise,
      experience,
      language,
      rating,
      type,
      isFreeNum,
      finalPrice,
    ]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Pandit created successfully",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }

    console.error("Create Pandit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Pandit",
    });
  } finally {
    connection.release();
  }
};

/* ================= GET ALL PANDITS ================= */
export const getAllPandit = async (req, res) => {
  const connection = db.promise();

  try {
    const { page, limit, offset } = getPagination(req);

    const { status, temple_id, expertise, type, sortby } = req.query;

    let whereQuery = `WHERE 1=1`;
    const whereParams = [];

    // ✅ status filter
    if (status && ["active", "inactive"].includes(status)) {
      whereQuery += ` AND p.status = ?`;
      whereParams.push(status);
    } else {
      whereQuery += ` AND p.status = 'active'`;
    }

    // ✅ temple filter
    if (temple_id && !isNaN(Number(temple_id))) {
      whereQuery += ` AND p.temple_id = ?`;
      whereParams.push(Number(temple_id));
    }

    // ✅ expertise filter
    if (expertise && expertise !== "all") {
      whereQuery += ` AND p.expertise = ?`;
      whereParams.push(expertise);
    }

    // ✅ type filter
    if (type && ["astro", "pandit"].includes(type)) {
      whereQuery += ` AND p.type = ?`;
      whereParams.push(type);
    }

    // ✅ Sort
    let orderByQuery = `ORDER BY p.created_at DESC`;

    if (sortby === "rating_high") orderByQuery = `ORDER BY p.rating DESC`;
    if (sortby === "rating_low") orderByQuery = `ORDER BY p.rating ASC`;
    if (sortby === "exp_high") orderByQuery = `ORDER BY p.experience DESC`;
    if (sortby === "exp_low") orderByQuery = `ORDER BY p.experience ASC`;
    if (sortby === "latest") orderByQuery = `ORDER BY p.created_at DESC`;

    // ✅ Total Count
    const [totalRows] = await connection.execute(
      `
      SELECT COUNT(*) as total
      FROM pandits p
      ${whereQuery}
      `,
      whereParams
    );

    const total = totalRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ Paginated data with temple name (JOIN)
    const [rows] = await connection.execute(
      `
      SELECT 
        p.*,
        t.name AS temple_name,
        t.city AS temple_city,
        t.state AS temple_state
      FROM pandits p
      LEFT JOIN temples t ON p.temple_id = t.id
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
    console.error("Get All Pandit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Pandits",
    });
  }
};

/* ================= UPDATE PANDIT ================= */
export const updatePandit = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;

    const {
      name,
      expertise,
      experience,
      language,
      rating,
      temple_id,
      type,

      is_free = 0,
      price_per_minute = null,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Pandit id is required",
      });
    }

    if (!name || !expertise || !experience || !language || !rating || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (!["astro", "pandit"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pandit type",
      });
    }

    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    // ✅ validate free/price
    const isFreeNum = Number(is_free) === 1 ? 1 : 0;

    let finalPrice = null;
    if (isFreeNum === 0) {
      const priceNum = Number(price_per_minute);
      if (!priceNum || priceNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "price_per_minute must be > 0 for paid pandit",
        });
      }
      finalPrice = priceNum;
    }

    // ✅ old image remove if new uploaded
    let imageQuery = "";
    let imageValue = [];

    if (req.file) {
      const [old] = await connection.execute(
        "SELECT image FROM pandits WHERE id = ?",
        [id]
      );

      if (old.length && old[0].image && fs.existsSync(old[0].image)) {
        fs.unlinkSync(old[0].image);
      }

      imageQuery = ", image = ?";
      imageValue.push(req.file.path);
    }

    await connection.beginTransaction();

    const updateQuery = `
      UPDATE pandits
      SET
        name = ?,
        temple_id = ?,
        expertise = ?,
        experience = ?,
        language = ?,
        rating = ?,
        type = ?,
        is_free = ?,
        price_per_minute = ?
        ${imageQuery},
        updated_at = NOW()
      WHERE id = ? AND status = 'active'
    `;

    const [result] = await connection.execute(updateQuery, [
      name,
      temple_id || null,
      expertise,
      experience,
      language,
      rating,
      type,
      isFreeNum,
      finalPrice,
      ...imageValue,
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Pandit not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Pandit updated successfully",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }

    console.error("Update Pandit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update Pandit",
    });
  } finally {
    connection.release();
  }
};

/* ================= DELETE PANDIT ================= */
export const deletePandit = async (req, res) => {
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
        message: "Pandit id is required",
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE pandits SET status = 'inactive', updated_at = NOW()
       WHERE id = ? AND status = 'active'`,
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Pandit not found or already deleted",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Pandit deleted successfully",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }

    console.error("Delete Pandit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete Pandit",
    });
  } finally {
    connection.release();
  }
};

/* ================= UPDATE PANDIT STATUS ================= */
export const updatePanditStatus = async (req, res) => {
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

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Pandit id is required",
      });
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required",
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE pandits SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Pandit not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Pandit ${status === "active" ? "activated" : "deactivated"
        } successfully`,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }

    console.error("Update Pandit Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update pandit status",
    });
  } finally {
    connection.release();
  }
};
