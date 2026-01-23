import db from "../utils/db.js";

export const createProductCategory = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO product_categories 
      (name)
      VALUES (?)
    `;

    await connection.execute(insertQuery, [name.trim()]);
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Product category created successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Product Category Error:", error);

    // Handle duplicate entry error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product category",
    });
  } finally {
    connection.release();
  }
};

export const getAllProductCategory = async (req, res) => {
  const connection = db.promise();

  try {
    // Get query parameters for filtering
    const { status } = req.query;

    let query = `
      SELECT 
        id,
        name,
        status,
        created_at,
        updated_at
      FROM product_categories
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
    console.error("Get All Product Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product categories",
    });
  }
};

export const updateProductCategory = async (req, res) => {
  if (req?.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { name, status } = req.body;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
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
      "SELECT id FROM product_categories WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // Check for duplicate name (excluding current category)
    const [duplicateRows] = await connection.execute(
      "SELECT id FROM product_categories WHERE name = ? AND id != ?",
      [name.trim(), id]
    );

    if (duplicateRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const updateQuery = `
      UPDATE product_categories
      SET
        name = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      name.trim(),
      status || "active",
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Product category updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Product Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product category",
    });
  } finally {
    connection.release();
  }
};

export const deleteProductCategory = async (req, res) => {
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
        message: "Valid category ID is required",
      });
    }

    await connection.beginTransaction();

    // ✅ check category exists
    const [checkRows] = await connection.execute(
      "SELECT id, status FROM product_categories WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    // ✅ toggle status
    const currentStatus = checkRows[0].status;
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const updateQuery = `
      UPDATE product_categories
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [newStatus, id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Failed to update product category status",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Product category status updated to ${newStatus}`,
      data: {
        id: parseInt(id),
        status: newStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Toggle Product Category Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product category status",
    });
  } finally {
    connection.release();
  }
};
