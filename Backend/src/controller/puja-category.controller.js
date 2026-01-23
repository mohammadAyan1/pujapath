import db from "../utils/db.js";

export const createPujaCategory = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    await connection.beginTransaction();

    // Check for duplicate active name
    const [existing] = await connection.execute(
      "SELECT id FROM puja_category WHERE name = ? AND status = 'active'",
      [name.trim()],
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Puja category name already exists",
      });
    }

    const insertQuery = `
      INSERT INTO puja_category 
      (name, description, status)
      VALUES (?, ?, 'active')
    `;

    await connection.execute(insertQuery, [
      name.trim(),
      description?.trim() || null,
    ]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Puja Category created successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Puja Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Puja Category",
    });
  } finally {
    connection.release();
  }
};

export const getAllPujaCategory = async (req, res) => {
  const connection = db.promise();

  try {
    // Get query parameters for filtering
    const { status } = req.query;

    let query = `
      SELECT 
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM puja_category
      WHERE 1=1
    `;

    const queryParams = [];

    // Filter by status if provided
    if (status && (status === "active" || status === "inactive")) {
      query += " AND status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await connection.execute(query, queryParams);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Puja category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Puja category",
    });
  }
};

export const updatePujaCategory = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { name, description, status } = req.body;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid puja category ID is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'inactive'",
      });
    }

    await connection.beginTransaction();

    // First, check if category exists
    const [checkRows] = await connection.execute(
      "SELECT id, name, status FROM puja_category WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja category not found",
      });
    }

    const currentCategory = checkRows[0];

    // Check for duplicate name ONLY IF name is being changed AND category is active
    if (name.trim() !== currentCategory.name && status !== "inactive") {
      // Check for duplicate active name (excluding current category)
      const [duplicateRows] = await connection.execute(
        "SELECT id FROM puja_category WHERE name = ? AND status = 'active' AND id != ?",
        [name.trim(), id],
      );

      if (duplicateRows.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Puja category name already exists",
        });
      }
    }

    const updateQuery = `
      UPDATE puja_category
      SET
        name = ?,
        description = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      name.trim(),
      description?.trim() || null,
      status || "active",
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja category not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Puja category updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Puja Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update puja category",
    });
  } finally {
    connection.release();
  }
};

export const deletePujaCategory = async (req, res) => {
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
        message: "Valid puja category ID is required",
      });
    }

    await connection.beginTransaction();

    // First, check if category exists
    const [checkRows] = await connection.execute(
      "SELECT id FROM puja_category WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja category not found",
      });
    }

    const updateQuery = `
      UPDATE puja_category
      SET status = 'inactive',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Failed to delete puja category",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Puja category deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Puja Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete puja category",
    });
  } finally {
    connection.release();
  }
};

// Add this new function for status toggle
export const updatePujaCategoryStatus = async (req, res) => {
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
        message: "Valid puja category ID is required",
      });
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required",
      });
    }

    await connection.beginTransaction();

    // First, check if category exists
    const [checkRows] = await connection.execute(
      "SELECT id, name FROM puja_category WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Puja category not found",
      });
    }

    const category = checkRows[0];

    // If activating a category, check for duplicate active names
    if (status === "active") {
      const [duplicateRows] = await connection.execute(
        "SELECT id FROM puja_category WHERE name = ? AND status = 'active' AND id != ?",
        [category.name, id],
      );

      if (duplicateRows.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message:
            "Cannot activate: Another active puja category with the same name exists",
        });
      }
    }

    const updateQuery = `
      UPDATE puja_category
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [status, id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Failed to update puja category status",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Puja category ${status === "active" ? "activated" : "deactivated"
        } successfully`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Puja Category Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update puja category status",
    });
  } finally {
    connection.release();
  }
};
