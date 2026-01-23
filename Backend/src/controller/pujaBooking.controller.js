

import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../utils/db.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ helper fetch puja
const getPujaById = async (connection, pujaId) => {
  const [rows] = await connection.execute(
    "SELECT * FROM puja WHERE id=? AND status='active'",
    [pujaId]
  );
  return rows?.[0] || null;
};

// ✅ 1) Create Razorpay Order for Puja
export const createPujaRazorpayOrder = async (req, res) => {
  let connection;

  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { puja_id, package_type, people_count, devotees, total_amount, whatsapp_number } =
      req.body;

    if (!puja_id || !package_type || !people_count || !total_amount || !whatsapp_number) {
      return res.status(400).json({
        success: false,
        message: "puja_id, package_type, people_count, total_amount required",
      });
    }

    if (
      !["single", "couple", "family", "joint_family"].includes(package_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package_type",
      });
    }

    const finalAmount = Number(total_amount);
    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total_amount",
      });
    }

    // ✅ devotees must be array
    if (!Array.isArray(devotees) || devotees.length !== Number(people_count)) {
      return res.status(400).json({
        success: false,
        message: "Devotees must match people_count",
      });
    }

    connection = await db.promise().getConnection();

    const puja = await getPujaById(connection, puja_id);
    if (!puja) {
      return res.status(404).json({ success: false, message: "Puja not found" });
    }

    // ✅ Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(finalAmount * 100), // paise
      currency: "INR",
      receipt: `receipt_puja_${Date.now()}`,
      notes: {
        puja_id: String(puja_id),
        user_id: String(userId),
        package_type: String(package_type),
        people_count: String(people_count),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Puja Razorpay order created",
      data: {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        puja: {
          id: puja.id,
          name: puja.name,
          price: puja.price,
          image: puja.image,
          description: puja.description,
        },
      },
    });
  } catch (error) {
    console.error("Create Puja Razorpay Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create puja Razorpay order",
    });
  } finally {
    if (connection) connection.release();
  }
};

// ✅ 2) Verify Razorpay + Insert booking
export const verifyPujaRazorpayAndBook = async (req, res) => {
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

      puja_id,
      package_type,
      people_count,
      devotees,
      total_amount,
      whatsapp_number
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !puja_id ||
      !package_type ||
      !people_count ||
      !total_amount
    ) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // if (!Array.isArray(devotees) || devotees.length !== Number(people_count)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Devotees must match people_count",
    //   });
    // }

    // ✅ Verify signature


    if (!Array.isArray(devotees) || devotees.length !== Number(people_count)) {
      return res.status(400).json({
        success: false,
        message: "Devotees must match people_count",
      });
    }

    if (!req.body.gotra || !req.body.gotra.trim()) {
      return res.status(400).json({
        success: false,
        message: "Gotra is required",
      });
    }


    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const puja = await getPujaById(connection, puja_id);
    if (!puja) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Puja not found" });
    }

    const finalAmount = Number(total_amount);

    // ✅ Insert payment first (payment_for_id will update later)
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
        'puja_booking', 0, ?,
        'razorpay', ?, ?, ?,
        ?, 'INR', 'success', NOW(), ?,
        NOW(), NOW()
      )
    `;

    // const metaData = JSON.stringify({
    //   puja_id,
    //   package_type,
    //   people_count,
    //   devotees,
    //   total_amount,
    //   whatsapp_number
    // });

    const metaData = JSON.stringify({
      booking_type: "puja",

      puja: {
        id: puja.id,
        name: puja.name,
        temple_id: puja.temple_id,
        puja_category_id: puja.puja_category_id,
        price: puja.price,
        duration: puja.duration,
        slot: puja.slot,
        puja_date: puja.puja_date,
        start_time: puja.start_time,
        schedule_type: puja.schedule_type,
        schedule_days: puja.schedule_days,
        image: puja.image,
        description: puja.description,
      },

      package_type,
      people_count,
      gotra: req.body.gotra,
      devotees,
      total_amount,
      whatsapp_number,
    });



    const [payResult] = await connection.execute(insertPaymentQuery, [
      userId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      finalAmount,
      metaData,
    ]);

    const paymentId = payResult.insertId;

    // const devoteesJson = JSON.stringify({
    //   whatsapp_number,
    //   devotees,
    // });

    // ✅ Insert puja booking


    const devoteesJson = JSON.stringify({
      whatsapp_number,
      gotra: req.body.gotra,

      puja: {
        id: puja.id,
        name: puja.name,
        price: puja.price,
        duration: puja.duration,
        start_time: puja.start_time,
        puja_date: puja.puja_date,
        schedule_type: puja.schedule_type,
        schedule_days: puja.schedule_days,
        image: puja.image,
      },

      devotees,
    });


    const insertBookingQuery = `
      INSERT INTO puja_booking
      (puja_id, user_id, devotees, payment_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'confirmed', NOW(), NOW())
    `;

    const [bookingResult] = await connection.execute(insertBookingQuery, [
      puja_id,
      userId,
      devoteesJson,
      paymentId,
    ]);

    const bookingId = bookingResult.insertId;

    // ✅ update payment_for_id with bookingId
    await connection.execute(
      "UPDATE payments SET payment_for_id=? WHERE id=?",
      [bookingId, paymentId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Payment verified and puja booked successfully",
      data: {
        bookingId,
        paymentId,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Verify Puja Razorpay Error:", error);

    return res.status(500).json({
      success: false,
      message: "Puja payment verification failed",
    });
  } finally {
    if (connection) connection.release();
  }
};

