import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../utils/db.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ---------------- COD MULTI PRODUCT ---------------- */
export const createCartCODBooking = async (req, res) => {
    let conn;
    try {
        const userId = req.user.id;
        const { items, address_id, shipping_price, platform_price, tax, total_value, total_item_price } = req.body;

        console.log(req?.body);


        console.log(userId);


        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        const [orderRes] = await conn.execute(
            `INSERT INTO orders
      (user_id,payment_method,address_id,shipping_price,tax_price,platform_fee,total_amount,total_item_price,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,'pending',NOW(),NOW())`,
            [userId, "COD", address_id, shipping_price, tax, platform_price, total_value, total_item_price]
        );

        const orderId = orderRes.insertId;

        console.log(orderId, "QWERTYUIOP");


        for (const item of items) {
            const [[product]] = await conn.execute(
                "SELECT * FROM products WHERE id=? AND stock>=?",
                [item.product_id, item.quantity]
            );

            if (!product) throw new Error("Stock issue");

            await conn.execute(
                `INSERT INTO product_booking
        (order_id,product_id,user_id,payment_method,address_id,quantity,price,status,created_at,updated_at,name,image,description)
        VALUES (?,?,?,?,?,?,?,'pending',NOW(),NOW(),?,?,?)`,
                [
                    orderId,
                    product.id,
                    userId,
                    "COD",
                    address_id,
                    item.quantity,
                    product.price,
                    product?.name,
                    product?.image,
                    product?.description,
                ]
            );

            await conn.execute(
                "UPDATE products SET stock=stock-? WHERE id=?",
                [item.quantity, product.id]
            );
        }

        await conn.execute(
            "DELETE FROM product_cart WHERE user_id=?",
            [userId]
        );

        console.log(orderId);


        await conn.commit();
        res.json({ success: true, orderId });
    } catch (err) {
        console.log(err);

        if (conn) await conn.rollback();
        res.status(500).json({ success: false });
    } finally {
        if (conn) conn.release();
    }
};




export const createCartRazorpayOrder = async (req, res) => {

    const userId = req?.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { total_value } = req.body;

    const order = await razorpay.orders.create({
        amount: total_value * 100,
        currency: "INR",
    });

    res.json({
        success: true,
        data: {
            razorpayOrderId: order.id,
            amount: order.amount,
        },
    });
};

// export const verifyCartRazorpay = async (req, res) => {
//     const userId = req?.user?.id;
//     if (!userId) {
//         return res.status(401).json({ success: false, message: "Unauthorized" });
//     }
//     let conn;
//     try {
//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//             items,
//             address_id,
//             total_value,
//             shipping_price,
//             platform_price,
//             tax,
//             total_item_price
//         } = req.body;



//         console.log(req?.body);


//         const body = razorpay_order_id + "|" + razorpay_payment_id;
//         const sig = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(body)
//             .digest("hex");

//         if (sig !== razorpay_signature) throw new Error("Invalid signature");

//         conn = await db.promise().getConnection();
//         await conn.beginTransaction();


//         const [paymentRes] = await conn.execute(
//             `INSERT INTO payments (payment_for_type,user_id,gateway,gateway_payment_id,gateway_order_id,gateway_signature,amount,currency,payment_status,paid_at,meta_data,created_at,updated_at) VALUES (product_order,?,razorpay,?,?,?,?,INR,success,NOW(),?,NOW(),NOW())`, [userId, razorpay_payment_id, razorpay_order_id, razorpay_signature, total_value,]
//         )

//         const paymentId = paymentRes.insertId;


//         const [orderRes] = await conn.execute(
//             `INSERT INTO orders
//       (user_id,payment_method,address_id,shipping_price,platform_fee,tax_price,total_amount,total_item_price,payment_id,status,created_at,updated_at)
//       VALUES (?,?,?,?, 'confirm',NOW(),NOW())`,
//             [req.user.id, "ONLINE", address_id, shipping_price, platform_price, tax, total_value, total_item_price, paymentId]
//         );

//         const orderId = orderRes.insertId;


//         const [updatePayment] = await conn.execute(`UPDATE payments SET payment_for_id WHERE id=? VALUES (?,?)`, [orderId, paymentId,])

//         console.log(updatePayment.insertId, "POIUYTREWQ");


//         for (const item of items) {

//             const [[product]] = await conn.execute(
//                 "SELECT * FROM products WHERE id=? AND stock>=?",
//                 [item.product_id, item.quantity]
//             );

//             if (!product) throw new Error("Stock issue");

//             const price = product?.price * item?.quantity
//             await conn.execute(
//                 `INSERT INTO product_booking
//         (order_id,product_id,user_id,payment_method,address_id,quantity,price,status,created_at,updated_at)
//         VALUES (?,?,?,?,?,?, ?,'confirm',NOW(),NOW())`,
//                 [
//                     orderId,
//                     item.product_id,
//                     req.user.id,
//                     "ONLINE",
//                     address_id,
//                     item.quantity,
//                     price
//                 ]
//             );

//             await conn.execute(
//                 "UPDATE products SET stock=stock-? WHERE id=?",
//                 [item.quantity, product.id]
//             );
//         }

//         console.log("mnbvcxz");


//         await conn.execute("DELETE FROM product_cart WHERE user_id=?", [
//             req.user.id,
//         ]);

//         await conn.commit();
//         res.json({ success: true, orderId });
//     } catch (err) {
//         if (conn) await conn.rollback();
//         res.status(500).json({ success: false });
//     } finally {
//         if (conn) conn.release();
//     }
// };


export const verifyCartRazorpay = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false });
    }

    let conn;
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            items = [],
            address_id,
            shipping_price = 0,
            platform_price = 0,
            tax = 0,
            total_item_price = 0,
            total_value = 0,
        } = req.body;

        /* ---------------- VERIFY SIGNATURE ---------------- */
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        /* ---------------- 1. INSERT PAYMENT ---------------- */
        const [paymentRes] = await conn.execute(
            `INSERT INTO payments
      (
        payment_for_type,
        payment_for_id,
        user_id,
        gateway,
        gateway_payment_id,
        gateway_order_id,
        gateway_signature,
        amount,
        currency,
        payment_status,
        paid_at,
        meta_data,
        created_at,
        updated_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,'success',NOW(),?,NOW(),NOW())`,
            [
                "product_order",
                0, // temporary, updated after order
                userId,
                "razorpay",
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                total_value,
                "INR",
                JSON.stringify({ items, address_id }),
            ]
        );

        const paymentId = paymentRes.insertId;

        /* ---------------- 2. CREATE ORDER ---------------- */
        const [orderRes] = await conn.execute(
            `INSERT INTO orders
      (
        user_id,
        payment_id,
        payment_method,
        address_id,
        total_item_price,
        shipping_price,
        tax_price,
        platform_fee,
        total_amount,
        status,
        created_at,
        updated_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,'confirm',NOW(),NOW())`,
            [
                userId,
                paymentId,
                "ONLINE",
                address_id,
                total_item_price,
                shipping_price,
                tax,
                platform_price,
                total_value,
            ]
        );

        const orderId = orderRes.insertId;

        /* ---------------- 3. LINK PAYMENT → ORDER ---------------- */
        await conn.execute(
            `UPDATE payments SET payment_for_id=? WHERE id=?`,
            [orderId, paymentId]
        );

        /* ---------------- 4. INSERT PRODUCT BOOKINGS ---------------- */
        for (const item of items) {
            const [[product]] = await conn.execute(
                "SELECT * FROM products WHERE id=? AND stock>=?",
                [item.product_id, item.quantity]
            );

            if (!product) throw new Error("Stock issue");

            await conn.execute(
                `INSERT INTO product_booking
        (
          order_id,
          product_id,
          user_id,
          payment_id,
          payment_method,
          address_id,
          quantity,
          price,
          shipping_price,
          platform_price,
          tax,
          total_value,
          name,
          image,
          description,
          status,
          created_at,
          updated_at
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'confirm',NOW(),NOW())`,
                [
                    orderId,
                    product.id,
                    userId,
                    paymentId,
                    "ONLINE",
                    address_id,
                    item.quantity,
                    product.price,
                    0,
                    0,
                    0,
                    0,
                    product.name,
                    product.image,
                    product.description,
                ]
            );

            await conn.execute(
                "UPDATE products SET stock = stock - ? WHERE id=?",
                [item.quantity, product.id]
            );
        }

        /* ---------------- 5. CLEAR CART ---------------- */
        await conn.execute(
            "DELETE FROM product_cart WHERE user_id=?",
            [userId]
        );

        await conn.commit();
        res.json({ success: true, orderId });

    } catch (err) {
        console.error(err);
        if (conn) await conn.rollback();
        res.status(500).json({ success: false });
    } finally {
        if (conn) conn.release();
    }
};
