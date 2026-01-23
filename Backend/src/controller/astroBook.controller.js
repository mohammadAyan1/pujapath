import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../utils/db.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ helper get astro/pandit by id
const getAstroById = async (connection, astroId) => {
  const [rows] = await connection.execute(
    "SELECT * FROM pandits WHERE id=? AND status='active'",
    [astroId]
  );
  return rows?.[0] || null;
};

// ✅ helper: check communication option exists
const parseCommunicationArray = (comm) => {
  try {
    if (!comm) return [];
    if (Array.isArray(comm)) return comm;
    if (typeof comm === "string") return JSON.parse(comm);
    return [];
  } catch {
    return [];
  }
};

// ✅ 1) Create Razorpay Order for Astro/Pandit booking
export const createAstroRazorpayOrder = async (req, res) => {
  let connection;

  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { astro_id, communication_type, duration_minutes, asker } = req.body;

    if (!astro_id || !communication_type || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: "astro_id, communication_type, duration_minutes required",
      });
    }

    if (!["call", "chat", "offline"].includes(communication_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid communication_type",
      });
    }

    const minutes = Number(duration_minutes);
    if (!minutes || minutes < 5) {
      return res.status(400).json({
        success: false,
        message: "Minimum duration is 5 minutes",
      });
    }

    connection = await db.promise().getConnection();

    // ✅ get astro/pandit
    const astro = await getAstroById(connection, astro_id);
    if (!astro) {
      return res.status(404).json({ success: false, message: "Astro not found" });
    }

    // ✅ check communication allowed
    const commArr = parseCommunicationArray(astro.communication);
    if (!commArr.includes(communication_type)) {
      return res.status(400).json({
        success: false,
        message: `This astro does not support ${communication_type}`,
      });
    }

    // ✅ if astro is offline only or not available
    if (communication_type === "offline") {
      return res.status(400).json({
        success: false,
        message: "Offline communication cannot be booked",
      });
    }

    // ✅ pricing rules
    const isFree = Number(astro.is_free) === 1;
    const pricePerMinute = Number(astro.price_per_minute || 0);

    let finalAmount = 0;

    if (isFree) {
      finalAmount = 0;
    } else {
      if (!pricePerMinute || pricePerMinute <= 0) {
        return res.status(400).json({
          success: false,
          message: "This astro has no valid price",
        });
      }
      finalAmount = pricePerMinute * minutes;
    }

    // ✅ create razorpay order (if amount > 0)
    let order = null;
    if (finalAmount > 0) {
      order = await razorpayInstance.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        receipt: `receipt_astro_${Date.now()}`,
        notes: {
          astro_id: String(astro_id),
          user_id: String(userId),
          communication_type: String(communication_type),
          duration_minutes: String(minutes),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Astro booking order created",
      data: {
        razorpayOrderId: order ? order.id : null,
        amount: finalAmount,
        currency: "INR",
        astro: {
          id: astro.id,
          name: astro.name,
          price_per_minute: astro.price_per_minute,
          is_free: astro.is_free,
          image: astro.image,
          type: astro.type,
        },
      },
    });
  } catch (error) {
    console.error("Create Astro Razorpay Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create astro booking order",
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ 2) Verify Razorpay + Insert payment + booking
// export const verifyAstroRazorpayAndBook = async (req, res) => {
//   let connection;

//   try {
//     const userId = req?.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,

//       astro_id,
//       communication_type,
//       duration_minutes,
//       asker,
//       total_amount,
//     } = req.body;

//     if (!astro_id || !communication_type || !duration_minutes) {
//       return res.status(400).json({ success: false, message: "Missing fields" });
//     }

//     if (!["call", "chat", "offline"].includes(communication_type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid communication_type",
//       });
//     }

//     const minutes = Number(duration_minutes);
//     if (!minutes || minutes < 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Minimum duration is 5 minutes",
//       });
//     }

//     connection = await db.promise().getConnection();
//     await connection.beginTransaction();

//     const astro = await getAstroById(connection, astro_id);
//     if (!astro) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Astro not found" });
//     }

//     // ✅ check communication allowed
//     const commArr = parseCommunicationArray(astro.communication);
//     if (!commArr.includes(communication_type)) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: `This astro does not support ${communication_type}`,
//       });
//     }

//     if (communication_type === "offline") {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Offline communication cannot be booked",
//       });
//     }

//     // ✅ calculate server-side amount (always trust backend)
//     const isFree = Number(astro.is_free) === 1;
//     const pricePerMinute = Number(astro.price_per_minute || 0);

//     let finalAmount = 0;
//     if (!isFree) {
//       if (!pricePerMinute || pricePerMinute <= 0) {
//         await connection.rollback();
//         return res.status(400).json({
//           success: false,
//           message: "This astro has no valid price",
//         });
//       }
//       finalAmount = pricePerMinute * minutes;
//     }

//     // ✅ if paid booking -> verify razorpay signature
//     if (finalAmount > 0) {
//       if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//         await connection.rollback();
//         return res.status(400).json({
//           success: false,
//           message: "Missing Razorpay payment fields",
//         });
//       }

//       const body = razorpay_order_id + "|" + razorpay_payment_id;
//       const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body)
//         .digest("hex");

//       if (expectedSignature !== razorpay_signature) {
//         await connection.rollback();
//         return res.status(400).json({
//           success: false,
//           message: "Invalid signature",
//         });
//       }
//     }

//     // ✅ insert payment (even free, store payment record for tracking)
//     const insertPaymentQuery = `
//       INSERT INTO payments
//       (
//         payment_for_type, payment_for_id, user_id,
//         gateway, gateway_payment_id, gateway_order_id, gateway_signature,
//         amount, currency, payment_status, paid_at, meta_data,
//         created_at, updated_at
//       )
//       VALUES
//       (
//         'astrology_booking', 0, ?,
//         ?, ?, ?, ?,
//         ?, 'INR', ?, NOW(), ?,
//         NOW(), NOW()
//       )
//     `;

//     const metaData = JSON.stringify({
//       astro_id,
//       communication_type,
//       duration_minutes: minutes,
//       asker: asker || null,
//     });

//     const [payResult] = await connection.execute(insertPaymentQuery, [
//       userId,
//       finalAmount > 0 ? "razorpay" : "free",
//       razorpay_payment_id || null,
//       razorpay_order_id || null,
//       razorpay_signature || null,
//       finalAmount,
//       finalAmount > 0 ? "success" : "success",
//       metaData,
//     ]);

//     const paymentId = payResult.insertId;

//     // ✅ insert astro booking
//     const insertBookingQuery = `
//       INSERT INTO astro_booking
//       (
//         astro_id, user_id, payment_id,
//         asker, communication_type, duration_minutes, amount,
//         booking_status, created_at, updated_at
//       )
//       VALUES
//       (?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), NOW())
//     `;

//     const [bookingResult] = await connection.execute(insertBookingQuery, [
//       astro_id,
//       userId,
//       paymentId,
//       JSON.stringify(asker || {}),
//       communication_type,
//       minutes,
//       finalAmount,
//     ]);

//     const bookingId = bookingResult.insertId;

//     // ✅ update payment_for_id
//     await connection.execute(
//       "UPDATE payments SET payment_for_id=? WHERE id=?",
//       [bookingId, paymentId]
//     );

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and astro booked successfully",
//       data: {
//         bookingId,
//         paymentId,
//         amount: finalAmount,
//         duration_minutes: minutes,
//         communication_type,
//       },
//     });
//   } catch (error) {
//     if (connection) await connection.rollback();
//     console.error("Verify Astro Razorpay Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Astro payment verification failed",
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };


// ✅ 2) Verify Razorpay + Insert payment + booking
export const verifyAstroRazorpayAndBook = async (req, res) => {
  let connection;

  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      astro_id,
      communication_type,
      duration_minutes,
      asker,
    } = req.body;

    if (!astro_id || !communication_type || !duration_minutes) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (!["call", "chat", "offline"].includes(communication_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid communication_type",
      });
    }

    const minutes = Number(duration_minutes);
    if (!minutes || minutes < 5) {
      return res.status(400).json({
        success: false,
        message: "Minimum duration is 5 minutes",
      });
    }

    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const astro = await getAstroById(connection, astro_id);
    if (!astro) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Astro not found" });
    }

    // ✅ check communication allowed
    const commArr = parseCommunicationArray(astro.communication);
    if (!commArr.includes(communication_type)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `This astro does not support ${communication_type}`,
      });
    }

    if (communication_type === "offline") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Offline communication cannot be booked",
      });
    }

    // ✅ calculate server-side amount
    const isFree = Number(astro.is_free) === 1;
    const pricePerMinute = Number(astro.price_per_minute || 0);

    let finalAmount = 0;
    if (!isFree) {
      if (!pricePerMinute || pricePerMinute <= 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "This astro has no valid price",
        });
      }
      finalAmount = pricePerMinute * minutes;
    }

    // ✅ verify signature only if paid
    if (finalAmount > 0) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Missing Razorpay payment fields",
        });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid signature",
        });
      }
    }

    // ✅ CREATE SNAPSHOT of astro/pandit at booking time
    const astroSnapshot = {
      id: astro.id,
      name: astro.name,
      type: astro.type,
      image: astro.image,
      temple_id: astro.temple_id,

      expertise: astro.expertise,
      expertise_list: astro.expertise_list,
      about: astro.about,
      language: astro.language,
      experience: astro.experience,
      rating: astro.rating,

      is_free: astro.is_free,
      price_per_minute: astro.price_per_minute,

      communication: astro.communication,
      images: astro.images,
    };

    // ✅ store FULL booking asker JSON
    const askerPayload = {
      user: asker || {},
      astro_snapshot: astroSnapshot,
      booking: {
        communication_type,
        duration_minutes: minutes,
        amount: finalAmount,
      },
    };

    // ✅ insert payment
    const insertPaymentQuery = `
      INSERT INTO payments
      (
        payment_for_type, payment_for_id, user_id,
        gateway, gateway_payment_id, gateway_order_id, gateway_signature,
        amount, currency, payment_status, paid_at, meta_data,
        created_at, updated_at
      )
      VALUES
      (
        'astrology_booking', 0, ?,
        ?, ?, ?, ?,
        ?, 'INR', 'success', NOW(), ?,
        NOW(), NOW()
      )
    `;

    const metaData = JSON.stringify({
      astro_id,
      communication_type,
      duration_minutes: minutes,
      amount: finalAmount,
      astro_snapshot: astroSnapshot,
      asker: asker || {},
    });

    const [payResult] = await connection.execute(insertPaymentQuery, [
      userId,
      finalAmount > 0 ? "razorpay" : "free",
      razorpay_payment_id || null,
      razorpay_order_id || null,
      razorpay_signature || null,
      finalAmount,
      metaData,
    ]);

    const paymentId = payResult.insertId;

    // ✅ insert booking (asker includes snapshot)
    const insertBookingQuery = `
      INSERT INTO astro_booking
      (
        astro_id, user_id, payment_id,
        asker,
        booking_status,
        created_at, updated_at
      )
      VALUES
      (?, ?, ?, ?, 'confirmed', NOW(), NOW())
    `;

    const [bookingResult] = await connection.execute(insertBookingQuery, [
      astro_id,
      userId,
      paymentId,
      JSON.stringify(askerPayload),
    ]);

    const bookingId = bookingResult.insertId;

    // ✅ update payment_for_id
    await connection.execute(
      "UPDATE payments SET payment_for_id=? WHERE id=?",
      [bookingId, paymentId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Payment verified and booked successfully",
      data: {
        bookingId,
        paymentId,
        amount: finalAmount,
        duration_minutes: minutes,
        communication_type,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Verify Astro Razorpay Error:", error);

    return res.status(500).json({
      success: false,
      message: "Astro payment verification failed",
    });
  } finally {
    if (connection) connection.release();
  }
};

