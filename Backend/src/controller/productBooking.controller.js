import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../utils/db.js";

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Helper: fetch product


const getProductById = async (connection, productId) => {
    const [rows] = await connection.execute(
        "SELECT * FROM products WHERE id=? AND status='active'",
        [productId]
    );
    return rows?.[0] || null;
};
// ✅ 1) COD BOOKING ✅
export const createCODBooking = async (req, res) => {
    let connection;
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false });

        const {
            product_id,
            quantity,
            address_id,
            shipping_price = 0,
            platform_price = 0,
            tax = 0,
            total_value = 0,
        } = req.body;

        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const product = await getProductById(connection, product_id);
        if (!product || product.stock < quantity) {
            await connection.rollback();
            return res.status(400).json({ success: false });
        }

        // ✅ 1. CREATE ORDER
        const [orderResult] = await connection.execute(
            `INSERT INTO orders 
            (user_id, payment_method, address_id, total_item_price, shipping_price, tax_price, platform_fee, total_amount, status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?, 'pending', NOW(), NOW())`,
            [
                userId,
                "COD",
                address_id,
                product.price * quantity,
                shipping_price,
                tax,
                platform_price,
                total_value,
            ]
        );




        const orderId = orderResult.insertId;

        console.log(orderId);


        // ✅ 2. CREATE PRODUCT BOOKING WITH order_id
        const [bookingResult] = await connection.execute(
            `INSERT INTO product_booking
            (order_id, product_id, user_id, payment_method, address_id, quantity,
             price, shipping_price, platform_price, tax, total_value,
             name, image, description, status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending', NOW(), NOW())`,
            [
                orderId,
                product.id,
                userId,
                "COD",
                address_id,
                quantity,
                product.price,
                shipping_price,
                platform_price,
                tax,
                total_value,
                product.name,
                product.image,
                product.description,
            ]
        );

        const bookingId = bookingResult.insertId;
        console.log(bookingId);



        await connection.execute(
            "UPDATE products SET stock = stock - ? WHERE id=?",
            [quantity, product.id]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            orderId,
            bookingId: bookingResult.insertId,
        });
    } catch (err) {
        if (connection) await connection.rollback();
        return res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ 2) CREATE RAZORPAY ORDER ✅
export const createRazorpayOrder = async (req, res) => {
    let connection;
    try {
        const userId = req?.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const {
            product_id,
            quantity,
            address_id,
            shipping_price = 0,
            platform_price = 0,
            tax = 0,
            total_value = 0,
        } = req.body;

        if (!product_id || !quantity || !address_id) {
            return res.status(400).json({
                success: false,
                message: "product_id, quantity, address_id required",
            });
        }

        connection = await db.promise().getConnection();

        const product = await getProductById(connection, product_id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: "Out of stock" });
        }

        const finalAmount = Number(total_value);
        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid total_value amount",
            });
        }

        const order = await razorpayInstance.orders.create({
            amount: Math.round(finalAmount * 100), // paise
            currency: "INR",
            receipt: `receipt_product_${Date.now()}`,
            notes: {
                product_id: String(product_id),
                user_id: String(userId),
                address_id: String(address_id),
                quantity: String(quantity),
                shipping_price: String(shipping_price),
                platform_price: String(platform_price),
                tax: String(tax),
                total_value: String(total_value),
            },
        });

        return res.status(200).json({
            success: true,
            message: "Razorpay order created",
            data: {
                razorpayOrderId: order.id,
                amount: order.amount, // ✅ FIXED
                currency: order.currency,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    description: product.description,
                },
            },
        });
    } catch (error) {
        console.error("Create Razorpay Order Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order",
        });
    } finally {
        if (connection) connection.release();
    }
};

// ✅ 3) VERIFY PAYMENT + BOOK PRODUCT ✅
// export const verifyRazorpayAndBook = async (req, res) => {
//     let connection;
//     try {
//         const userId = req?.user?.id;
//         if (!userId) {
//             return res.status(401).json({ success: false, message: "Unauthorized" });
//         }

//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//             product_id,
//             quantity,
//             address_id,

//             shipping_price = 0,
//             platform_price = 0,
//             tax = 0,
//             total_value = 0,
//         } = req.body;

//         if (
//             !razorpay_order_id ||
//             !razorpay_payment_id ||
//             !razorpay_signature ||
//             !product_id ||
//             !quantity ||
//             !address_id
//         ) {
//             return res.status(400).json({ success: false, message: "Missing fields" });
//         }

//         // ✅ Verify Signature
//         const body = razorpay_order_id + "|" + razorpay_payment_id;
//         const expectedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(body)
//             .digest("hex");

//         if (expectedSignature !== razorpay_signature) {
//             return res.status(400).json({ success: false, message: "Invalid signature" });
//         }

//         connection = await db.promise().getConnection();
//         await connection.beginTransaction();

//         const product = await getProductById(connection, product_id);

//         if (!product) {
//             await connection.rollback();
//             return res.status(404).json({ success: false, message: "Product not found" });
//         }

//         if (product.stock < quantity) {
//             await connection.rollback();
//             return res.status(400).json({ success: false, message: "Out of stock" });
//         }

//         const finalAmount = Number(total_value);

//         // ✅ Insert Payment
//         const insertPaymentQuery = `
//       INSERT INTO payments
//       (payment_for_type, payment_for_id, user_id, gateway, gateway_payment_id, gateway_order_id, gateway_signature,
//        amount, currency, payment_status, paid_at, meta_data, created_at, updated_at)
//       VALUES (?,?,?,?,?,?,?,?,?,'success', NOW(), ?, NOW(), NOW())
//     `;

//         const meta_data = JSON.stringify({
//             product_id,
//             address_id,
//             quantity,
//             shipping_price,
//             platform_price,
//             tax,
//             total_value,
//         });



//         const [payResult] = await connection.execute(insertPaymentQuery, [
//             "product_order",
//             0,
//             userId,
//             "razorpay",
//             razorpay_payment_id,
//             razorpay_order_id,
//             razorpay_signature,
//             finalAmount,
//             "INR",
//             meta_data,
//         ]);

//         const paymentId = payResult.insertId;

//         const insertOrderQuery = `INSERT INTO orders (
//          user_id, payment_id, payment_method, address_id, items,total_item_price,shipping_price,tax_price,platform_fee,total_amount,status,created_at, updated_at
//         ) VALUES (?,?,?,?,?,?,?,?,?,?,'confirm', NOW(), NOW())`

//         const [bookingOrderResult] = await connection.execute(insertOrderQuery, [
//             userId,
//             paymentId,
//             "ONLINE", // ✅ must be "ONLINE"
//             address_id,
//             quantity,
//             product.price,
//             shipping_price,
//             platform_price,
//             tax,
//             total_value,
//         ])

//         // ✅ Insert Booking (Confirm) ✅ FIXED WITH NEW COLUMNS
//         const insertBookingQuery = `
//       INSERT INTO product_booking
//       (
//         product_id, user_id, payment_id, payment_method, address_id, quantity,
//         price, shipping_price, platform_price, tax, total_value,
//         name, image, description,
//         status, created_at, updated_at
//       )
//       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'confirm', NOW(), NOW())
//     `;
//         const [bookingResult] = await connection.execute(insertBookingQuery, [
//             product.id,
//             userId,
//             paymentId,
//             "ONLINE", // ✅ must be "ONLINE"
//             address_id,
//             quantity,

//             product.price,
//             shipping_price,
//             platform_price,
//             tax,
//             total_value,

//             product.name,
//             product.image,
//             product.description,
//         ]);

//         const bookingId = bookingResult.insertId;

//         // ✅ Update payment_for_id
//         await connection.execute("UPDATE payments SET payment_for_id=? WHERE id=?", [
//             bookingId,
//             paymentId,
//         ]);

//         // ✅ reduce stock
//         await connection.execute("UPDATE products SET stock = stock - ? WHERE id=?", [
//             quantity,
//             product.id,
//         ]);

//         // ✅ Get current cart quantity
//         const [cartRows] = await connection.execute(
//             "SELECT quantity FROM product_cart WHERE user_id=? AND product_id=?",
//             [userId, product.id]
//         );

//         if (cartRows.length === 0) {
//             // nothing in cart
//         } else {
//             const currentQty = cartRows[0].quantity;

//             if (currentQty <= quantity) {
//                 // ✅ If booking qty is equal or more -> delete row
//                 await connection.execute(
//                     "DELETE FROM product_cart WHERE user_id=? AND product_id=?",
//                     [userId, product.id]
//                 );
//             } else {
//                 // ✅ Otherwise reduce quantity
//                 await connection.execute(
//                     "UPDATE product_cart SET quantity = quantity - ? WHERE user_id=? AND product_id=?",
//                     [quantity, userId, product.id]
//                 );
//             }
//         }



//         await connection.commit();

//         return res.status(200).json({
//             success: true,
//             message: "Payment verified and product booked successfully",
//             data: { bookingId, paymentId },
//         });
//     } catch (error) {
//         if (connection) await connection.rollback();
//         console.error("Verify Razorpay Error:", error);
//         return res.status(500).json({ success: false, message: "Payment verification failed" });
//     } finally {
//         if (connection) connection.release();
//     }
// };
export const verifyRazorpayAndBook = async (req, res) => {
    let connection;
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false });

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            product_id,
            quantity,
            address_id,
            shipping_price = 0,
            platform_price = 0,
            tax = 0,
            total_value = 0,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false });
        }

        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const product = await getProductById(connection, product_id);
        if (!product || product.stock < quantity) {
            await connection.rollback();
            return res.status(400).json({ success: false });
        }

        // ✅ 1. CREATE ORDER
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
            (user_id, payment_method, address_id, total_item_price, shipping_price, tax_price, platform_fee, total_amount, status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?, 'confirm', NOW(), NOW())`,
            [
                userId,
                "ONLINE",
                address_id,
                product.price * quantity,
                shipping_price,
                tax,
                platform_price,
                total_value,
            ]
        );

        const orderId = orderResult.insertId;

        console.log(orderId, "POIUYTREWQ");


        // ✅ 2. CREATE PAYMENT WITH order_id
        const [paymentResult] = await connection.execute(
            `INSERT INTO payments
            (payment_for_type, payment_for_id, user_id, gateway,
             gateway_payment_id, gateway_order_id, gateway_signature,
             amount, currency, payment_status, paid_at, meta_data, created_at, updated_at)
            VALUES ('product_order', ?, ?, 'razorpay', ?, ?, ?, ?, 'INR', 'success', NOW(), ?, NOW(), NOW())`,
            [
                orderId,
                userId,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                total_value,
                JSON.stringify({ product_id, quantity }),
            ]
        );



        const paymentId = paymentResult.insertId;
        console.log(paymentId, "ASDFGHJKL");

        // ✅ 3. CREATE PRODUCT BOOKING WITH order_id
        const [bookingResult] = await connection.execute(
            `INSERT INTO product_booking
            (order_id, product_id, user_id, payment_id, payment_method, address_id, quantity,
             price, shipping_price, platform_price, tax, total_value,
             name, image, description, status, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'confirm', NOW(), NOW())`,
            [
                orderId,
                product.id,
                userId,
                paymentId,
                "ONLINE",
                address_id,
                quantity,
                product.price,
                shipping_price,
                platform_price,
                tax,
                total_value,
                product.name,
                product.image,
                product.description,
            ]
        );
        const lkjh = bookingResult.insertId
        console.log(lkjh, "ZXCVBNM");


        await connection.execute(
            "UPDATE products SET stock = stock - ? WHERE id=?",
            [quantity, product.id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            orderId,
            paymentId,
            bookingId: bookingResult.insertId,
        });
    } catch (err) {
        console.log(err);

        if (connection) await connection.rollback();
        return res.status(500).json({ success: false });
    } finally {
        if (connection) connection.release();
    }
};

