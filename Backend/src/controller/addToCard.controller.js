import db from "../utils/db.js";


/* =====================================================
   GET CART PRODUCTS (USER OR GUEST)
   GET /api/product-addtocard?guestId=xxxx
===================================================== */
export const getAddToCartProduct = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const guestId = req.query.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: "User or guest id required",
      });
    }

    const [rows] = await db.promise().execute(
      `
      SELECT 
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.image,
        p.stock,
        (p.price * c.quantity) AS total_price
      FROM product_cart c
      JOIN products p ON p.id = c.product_id
      WHERE
        (
          (? IS NOT NULL AND c.user_id = ?)
          OR
          (? IS NOT NULL AND c.guest_id = ?)
        )
      ORDER BY c.created_at DESC
      `,
      [userId, userId, guestId, guestId]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart products",
    });
  }
};

/* =====================================================
   ADD TO CART (WITH STOCK LIMIT CHECK)
===================================================== */
export const createAddToCartProduct = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const userId = req.user?.id || null;
    const { guestId, product_id } = req.body;
    const addQty = Number(req.body.quantity) || 1;

    if (!product_id || addQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or quantity",
      });
    }

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: "User or guest id required",
      });
    }

    await connection.beginTransaction();

    /* 🔍 1. Check product stock */
    const [[product]] = await connection.execute(
      `SELECT stock FROM products WHERE id=? AND status='active'`,
      [product_id]
    );

    if (!product) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Product out of stock",
      });
    }

    /* 🔍 2. Check if product already exists in cart */
    const [[cart]] = await connection.execute(
      `
      SELECT id, quantity FROM product_cart
      WHERE product_id = ?
      AND (
        (user_id = ? AND ? IS NOT NULL)
        OR
        (guest_id = ? AND ? IS NOT NULL)
      )
      `,
      [product_id, userId, userId, guestId, guestId]
    );

    if (cart) {
      /* ➕ Increase quantity */
      const newQty = cart.quantity + addQty;

      if (newQty > product.stock) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Maximum stock limit reached (Available: ${product.stock})`,
        });
      }

      await connection.execute(
        `
        UPDATE product_cart
        SET quantity=?, updated_at=NOW()
        WHERE id=?
        `,
        [newQty, cart.id]
      );
    } else {
      /* ➕ Insert new product */
      if (addQty > product.stock) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available`,
        });
      }

      await connection.execute(
        `
        INSERT INTO product_cart (user_id, guest_id, product_id, quantity)
        VALUES (?, ?, ?, ?)
        `,
        [userId, guestId, product_id, addQty]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Add To Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  } finally {
    connection.release();
  }
};

/* =====================================================
   UPDATE CART QUANTITY
===================================================== */
export const updateAddToCartProduct = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const userId = req.user?.id || null;
    const { guestId, quantity } = req.body;
    const { id } = req.params;

    if (!id || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid cart id & quantity required",
      });
    }

    await connection.beginTransaction();

    const [[cart]] = await connection.execute(
      `
      SELECT c.product_id, p.stock
      FROM product_cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.id=?
      AND (c.user_id=? OR c.guest_id=?)
      `,
      [id, userId, guestId]
    );

    if (!cart) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    if (quantity > cart.stock) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Maximum available stock is ${cart.stock}`,
      });
    }

    await connection.execute(
      `
      UPDATE product_cart
      SET quantity=?, updated_at=NOW()
      WHERE id=?
      `,
      [quantity, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  } finally {
    connection.release();
  }
};

/* =====================================================
   DELETE ALL CART ITEMS (USER / GUEST)
===================================================== */
export const deleteAllAddToCartProduct = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { guestId } = req.body;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: "User or guest id required",
      });
    }

    if (userId) {
      await db.promise().execute(`DELETE FROM product_cart WHERE user_id=?`, [
        userId,
      ]);
    } else {
      await db.promise().execute(`DELETE FROM product_cart WHERE guest_id=?`, [
        guestId,
      ]);
    }

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};

export const deleteSingleCartItem = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { guestId } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Cart id required" });
    }

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: "User or guest id required",
      });
    }

    if (userId) {
      await db.promise().execute(`DELETE FROM product_cart WHERE id=? AND user_id=?`, [
        id,
        userId,
      ]);
    } else {
      await db.promise().execute(`DELETE FROM product_cart WHERE id=? AND guest_id=?`, [
        id,
        guestId,
      ]);
    }

    res.json({ success: true, message: "Item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

export const replaceGuestIdToUserId = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const guestId = req.params.id;
    const userId = req.user?.id;

    if (!guestId) {
      return res.status(400).json({
        message: "Guest Id is Required",
        success: false,
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    await connection.beginTransaction();

    // ✅ 1) Get all guest cart items
    const [guestItems] = await connection.execute(
      `SELECT id, product_id, quantity 
       FROM product_cart 
       WHERE guest_id = ?`,
      [guestId]
    );

    // ✅ if nothing in guest cart, just return
    if (!guestItems.length) {
      await connection.commit();
      return res.status(200).json({
        message: "Guest cart is empty",
        success: true,
      });
    }

    // ✅ 2) Loop each guest item
    for (const item of guestItems) {
      // check if user already has same product
      const [userCart] = await connection.execute(
        `SELECT id, quantity 
         FROM product_cart 
         WHERE user_id = ? AND product_id = ?`,
        [userId, item.product_id]
      );

      if (userCart.length > 0) {
        // ✅ Already exists => merge quantity
        await connection.execute(
          `UPDATE product_cart 
           SET quantity = quantity + ?, updated_at = NOW()
           WHERE id = ?`,
          [item.quantity, userCart[0].id]
        );

        // ✅ delete guest row (because merged)
        await connection.execute(
          `DELETE FROM product_cart WHERE id = ?`,
          [item.id]
        );
      } else {
        // ✅ Not exists => move guest row to user
        await connection.execute(
          `UPDATE product_cart
           SET user_id = ?, guest_id = NULL, updated_at = NOW()
           WHERE id = ?`,
          [userId, item.id]
        );
      }
    }

    await connection.commit();

    return res.status(200).json({
      message: "Guest cart merged into user cart successfully ✅",
      success: true,
    });
  } catch (error) {
    await connection.rollback();
    console.log("replaceGuestIdToUserId Error:", error);

    return res.status(500).json({
      message: "Failed to replace guest cart",
      success: false,
    });
  } finally {
    connection.release();
  }
};

