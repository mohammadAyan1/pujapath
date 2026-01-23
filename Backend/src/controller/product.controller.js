import db from "../utils/db.js";
import fs from "fs";
import path from "path";
import { getPagination } from "../utils/pagination.js";

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { product_category_id, name, price, stock, description } = req.body;
    const image = req.file?.path || null;

    if (!product_category_id || !name || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    await connection.beginTransaction();

    // Check if product name already exists
    const [existingProduct] = await connection.execute(
      "SELECT id FROM products WHERE name = ?",
      [name],
    );

    if (existingProduct.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Product name already exists",
      });
    }

    await connection.execute(
      `INSERT INTO products
       (product_category_id, name, price, stock, image, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [product_category_id, name, price, stock, image, description || null],
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  } finally {
    connection.release();
  }
};

/* ================= GET ALL PRODUCTS ================= */

export const getAllProduct = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, offset, category, sortBy } = getPagination(req);

    let whereQuery = `WHERE 1=1`;
    const whereParams = [];

    // ✅ status filter
    if (status && (status === "active" || status === "inactive")) {
      whereQuery += ` AND p.status = ?`;
      whereParams.push(status);
    }

    // ✅ category filter
    if (!Number.isNaN(category) && category) {
      whereQuery += ` AND p.product_category_id = ?`;
      whereParams.push(category);
    }

    // ✅ only active category
    whereQuery += ` AND pc.status = 'active'`;

    // ✅ ORDER BY logic
    let orderByQuery = `ORDER BY p.created_at DESC`; // default

    if (sortBy === "price_low") {
      orderByQuery = `ORDER BY p.price ASC`;
    } else if (sortBy === "price_high") {
      orderByQuery = `ORDER BY p.price DESC`;
    } else if (sortBy === "latest") {
      orderByQuery = `ORDER BY p.created_at DESC`;
    }

    // ✅ Total count
    const [totalRows] = await db.promise().execute(
      `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN product_categories pc ON p.product_category_id = pc.id
      ${whereQuery}
      `,
      whereParams
    );

    const total = totalRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ Paginated data
    // ✅ Paginated data (fixed)
    const [rows] = await db.promise().execute(
      `
  SELECT 
    p.*,
    pc.name as category_name
  FROM products p
  LEFT JOIN product_categories pc ON p.product_category_id = pc.id
  ${whereQuery}
  ${orderByQuery}
  LIMIT ${limit} OFFSET ${offset}
  `,
      whereParams
    );



    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};


export const getProductById = async (req, res) => {
  const connection = db.promise()
  try {

    const { id } = req.params

    console.log(id);

    if (!id) {
      return res.status(403).json({
        message: "product did not fecth By id",
        success: false
      })

    }

    const getQuery = `SELECT * FROM products WHERE id = ?`
    const [rows] = await connection.execute(getQuery, [id])


    console.log(rows);


    if (!rows.length > 0) {
      return res.status(403).json({
        message: "Product Not Found",
        success: false
      })
    }

    res.status(200).json({
      message: "product fetch successfully By Id",
      success: true,
      data: rows
    })

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error While Fetching Product By ID",
      success: false
    })

  }
}



/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;
    const { product_category_id, name, price, stock, description, status } =
      req.body;
    const image = req.file?.path || null;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    if (!product_category_id || !name || !price || !stock) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
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

    // First, check if product exists
    const [checkRows] = await connection.execute(
      "SELECT id, image FROM products WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete old image if new image is uploaded
    if (image && checkRows[0].image) {
      const oldPath = path.join("uploads/products", checkRows[0].image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Check for duplicate name (excluding current product)
    const [duplicateRows] = await connection.execute(
      "SELECT id FROM products WHERE name = ? AND id != ?",
      [name, id],
    );

    if (duplicateRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Product name already exists",
      });
    }

    const updateQuery = `
      UPDATE products SET
        product_category_id = ?,
        name = ?,
        price = ?,
        stock = ?,
        description = ?,
        image = COALESCE(?, image),
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      product_category_id,
      name,
      price,
      stock,
      description || null,
      image,
      status || "active",
      id,
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  } finally {
    connection.release();
  }
};

/* ================= UPDATE PRODUCT STATUS ================= */
export const updateProductStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (active/inactive) is required",
      });
    }

    await connection.beginTransaction();

    // First, check if product exists
    const [checkRows] = await connection.execute(
      "SELECT id FROM products WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updateQuery = `
      UPDATE products SET
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await connection.execute(updateQuery, [status, id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Product ${status === "active" ? "activated" : "deactivated"
        } successfully`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Product Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  } finally {
    connection.release();
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin only",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    await connection.beginTransaction();

    // First, check if product exists
    const [checkRows] = await connection.execute(
      "SELECT id FROM products WHERE id = ?",
      [id],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [result] = await connection.execute(
      `UPDATE products
       SET status = 'inactive',
           updated_at = NOW()
       WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  } finally {
    connection.release();
  }
};
