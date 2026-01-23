import db from "../utils/db.js";
import fs from "fs";
import { getPagination } from "../utils/pagination.js";

const safeParseArray = (val) => {
  try {
    if (!val) return [];
    if (Array.isArray(val)) return val;

    // if already JSON string like ["a","b"]
    if (typeof val === "string") {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    }

    return [];
  } catch (err) {
    // ✅ if it is old plain string path (not JSON), convert to array
    if (typeof val === "string" && val.includes("uploads")) {
      return [val];
    }
    return [];
  }
};


/* ================= CREATE PANDIT ================= */
// export const createPandit = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = await db.promise().getConnection();

//   try {
//     const {
//       name,
//       expertise,
//       experience,
//       language,
//       rating,
//       temple_id,
//       type,
//       is_free = 0,
//       price_per_minute = null,

//       // ✅ NEW
//       communication,
//     } = req.body;

//     const image = req.file ? req.file.path : null;

//     if (!name || !expertise || !experience || !language || !rating || !type) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     // ✅ NEW: parse communication
//     let commArray = [];
//     try {
//       commArray = communication ? JSON.parse(communication) : [];
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid communication format",
//       });
//     }

//     const allowedOptions = ["call", "chat", "offline"];
//     const isValidComm =
//       Array.isArray(commArray) &&
//       commArray.length > 0 &&
//       commArray.every((x) => allowedOptions.includes(x));

//     if (!isValidComm) {
//       return res.status(400).json({
//         success: false,
//         message: "communication must include call/chat/offline (at least one)",
//       });
//     }

//     // ✅ validate free/price
//     const isFreeNum = Number(is_free) === 1 ? 1 : 0;

//     let finalPrice = null;
//     if (isFreeNum === 0) {
//       const priceNum = Number(price_per_minute);
//       if (!priceNum || priceNum <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "price_per_minute must be > 0 for paid pandit",
//         });
//       }
//       finalPrice = priceNum;
//     }

//     await connection.beginTransaction();

//     const insertQuery = `
//       INSERT INTO pandits
//       (
//         name, image, temple_id,
//         expertise, experience, language, rating,
//         status, is_available,
//         type, is_free, price_per_minute,
//         communication
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?)
//     `;

//     await connection.execute(insertQuery, [
//       name,
//       image,
//       temple_id || null,
//       expertise,
//       experience,
//       language,
//       rating,
//       type,
//       isFreeNum,
//       finalPrice,
//       JSON.stringify(commArray),
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

      communication,

      // ✅ NEW
      about,
      expertise_list,
    } = req.body;

    // ✅ profile image
    const profileImage =
      req.files?.image?.length > 0 ? req.files.image[0].path : null;

    console.log(profileImage);


    // ✅ multiple gallery images
    const galleryImages =
      req.files?.images?.length > 0
        ? req.files.images.map((f) => f.path)
        : [];

    console.log(galleryImages);


    if (!name || !experience || !language || !rating || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // ✅ Communication
    let commArray = [];
    try {
      commArray = communication ? JSON.parse(communication) : [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid communication format",
      });
    }

    const allowedOptions = ["call", "chat", "offline"];
    const isValidComm =
      Array.isArray(commArray) &&
      commArray.length > 0 &&
      commArray.every((x) => allowedOptions.includes(x));

    if (!isValidComm) {
      return res.status(400).json({
        success: false,
        message: "communication must include call/chat/offline (at least one)",
      });
    }

    // ✅ Expertise list (multiple)
    let expertiseArray = [];
    try {
      expertiseArray = expertise_list ? JSON.parse(expertise_list) : [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid expertise_list format",
      });
    }

    if (!Array.isArray(expertiseArray) || expertiseArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "expertise_list must be an array with at least one item",
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
        name, image, images, temple_id,
        expertise, expertise_list,
        about,
        experience, language, rating,
        status, is_available,
        type, is_free, price_per_minute,
        communication
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      name,
      profileImage,
      JSON.stringify(galleryImages),
      temple_id || null,
      expertise || null, // optional old field
      JSON.stringify(expertiseArray),
      about || null,
      experience,
      language,
      rating,
      type,
      isFreeNum,
      finalPrice,
      JSON.stringify(commArray),
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

/* ================= GET PANDIT BY ID ✅ ================= */
export const getPanditById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid pandit id is required",
      });
    }

    const [rows] = await db.promise().execute(
      `
      SELECT 
        p.*,
        t.name AS temple_name,
        t.city AS temple_city,
        t.state AS temple_state
      FROM pandits p
      LEFT JOIN temples t ON p.temple_id = t.id
      WHERE p.id = ? AND p.status = 'active'
      `,
      [Number(id)]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Pandit not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get Pandit By Id Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pandit",
    });
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

//     const {
//       name,
//       expertise,
//       experience,
//       language,
//       rating,
//       temple_id,
//       type,
//       is_free = 0,
//       price_per_minute = null,

//       // ✅ NEW
//       communication,
//     } = req.body;

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

//     // ✅ NEW: parse communication
//     let commArray = [];
//     try {
//       commArray = communication ? JSON.parse(communication) : [];
//     } catch (err) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid communication format",
//       });
//     }

//     const allowedOptions = ["call", "chat", "offline"];
//     const isValidComm =
//       Array.isArray(commArray) &&
//       commArray.length > 0 &&
//       commArray.every((x) => allowedOptions.includes(x));

//     if (!isValidComm) {
//       return res.status(400).json({
//         success: false,
//         message: "communication must include call/chat/offline (at least one)",
//       });
//     }

//     // ✅ validate free/price
//     const isFreeNum = Number(is_free) === 1 ? 1 : 0;

//     let finalPrice = null;
//     if (isFreeNum === 0) {
//       const priceNum = Number(price_per_minute);
//       if (!priceNum || priceNum <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "price_per_minute must be > 0 for paid pandit",
//         });
//       }
//       finalPrice = priceNum;
//     }

//     // ✅ old image remove if new uploaded
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
//         type = ?,
//         is_free = ?,
//         price_per_minute = ?,
//         communication = ?
//         ${imageQuery},
//         updated_at = NOW()
//       WHERE id = ? AND status = 'active'
//     `;

//     const [result] = await connection.execute(updateQuery, [
//       name,
//       temple_id || null,
//       expertise,
//       experience,
//       language,
//       rating,
//       type,
//       isFreeNum,
//       finalPrice,
//       JSON.stringify(commArray),
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

      communication,

      // ✅ NEW
      about,
      expertise_list,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid pandit id is required",
      });
    }

    if (!name || !experience || !language || !rating || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // ✅ Communication parse
    let commArray = [];
    try {
      commArray = communication ? JSON.parse(communication) : [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid communication format",
      });
    }

    const allowedComm = ["call", "chat", "offline"];
    const validComm =
      Array.isArray(commArray) &&
      commArray.length > 0 &&
      commArray.every((x) => allowedComm.includes(x));

    if (!validComm) {
      return res.status(400).json({
        success: false,
        message: "communication must include call/chat/offline (at least one)",
      });
    }

    // ✅ Expertise list parse
    let expertiseArray = [];
    try {
      expertiseArray = expertise_list ? JSON.parse(expertise_list) : [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid expertise_list format",
      });
    }

    if (!Array.isArray(expertiseArray) || expertiseArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "expertise_list must be an array with at least one item",
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

    // ✅ get old images for merge (if needed)
    const [oldData] = await connection.execute(
      "SELECT image, images FROM pandits WHERE id = ?",
      [Number(id)]
    );

    if (!oldData.length) {
      return res.status(404).json({
        success: false,
        message: "Pandit not found",
      });
    }

    // const oldImages = oldData[0]?.images ? JSON.parse(oldData[0].images) : [];
    const oldImages = safeParseArray(oldData[0]?.images);


    // ✅ profile image update
    let profileImageQuery = "";
    let profileImageValue = [];

    if (req.files?.image?.length > 0) {
      const newProfile = req.files.image[0].path;

      // remove old profile file
      const oldProfile = oldData[0].image;
      if (oldProfile && fs.existsSync(oldProfile)) {
        fs.unlinkSync(oldProfile);
      }

      profileImageQuery = ", image = ?";
      profileImageValue.push(newProfile);
    }

    // ✅ gallery images update (merge)
    let galleryFinal = [...oldImages];

    if (req.files?.images?.length > 0) {
      const newGallery = req.files.images.map((f) => f.path);
      galleryFinal = [...galleryFinal, ...newGallery];
    }

    await connection.beginTransaction();

    const updateQuery = `
      UPDATE pandits
      SET
        name = ?,
        temple_id = ?,
        expertise = ?,
        expertise_list = ?,
        about = ?,
        experience = ?,
        language = ?,
        rating = ?,
        type = ?,
        is_free = ?,
        price_per_minute = ?,
        communication = ?,
        images = ?
        ${profileImageQuery},
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      name,
      temple_id || null,
      expertise || null,
      JSON.stringify(expertiseArray),
      about || null,
      experience,
      language,
      rating,
      type,
      isFreeNum,
      finalPrice,
      JSON.stringify(commArray),
      JSON.stringify(galleryFinal),
      ...profileImageValue,
      Number(id),
    ]);

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
