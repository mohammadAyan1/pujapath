

import db from "../utils/db.js";

const safeJSON = (val, fallback) => {
    try {
        if (!val) return fallback;
        if (typeof val === "object") return val;
        if (typeof val === "string") return JSON.parse(val);
        return fallback;
    } catch {
        return fallback;
    }
};

export const getMyBookings = async (req, res) => {
    const connection = db.promise();

    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const type = req.query.type || "product";
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 6;
        const offset = (page - 1) * limit;

        let rows = [];


        /* ================= PRODUCT ORDERS ================= */
        if (type === "product") {
            // 1️⃣ Fetch ORDERS (not product_booking)
            const [orders] = await connection.execute(
                `
        SELECT 
            id,
            payment_method,
            status,
            total_amount,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `,
                [userId]
            );

            if (!orders.length) {
                rows = [];
            } else {
                // 2️⃣ Fetch all items for these orders
                const orderIds = orders.map(o => o.id);

                const [items] = await connection.query(
                    `
            SELECT 
                order_id,
                product_id,
                name,
                image,
                quantity,
                price,
                total_value,
                status
            FROM product_booking
            WHERE order_id IN (?)
            ORDER BY created_at DESC
            `,
                    [orderIds]
                );

                // 3️⃣ Group items by order_id
                const itemsByOrder = {};
                for (const item of items) {
                    if (!itemsByOrder[item.order_id]) {
                        itemsByOrder[item.order_id] = [];
                    }
                    itemsByOrder[item.order_id].push(item);
                }

                // 4️⃣ Build final response
                rows = orders.map(order => ({
                    booking_type: "product",
                    booking_id: order.id,          // IMPORTANT: order id
                    payment_method: order.payment_method,
                    status: order.status,
                    total_amount: order.total_amount,
                    created_at: order.created_at,
                    items: itemsByOrder[order.id] || [],
                }));
            }
        }


        /* ================= PUJA BOOKINGS ================= */
        if (type === "puja") {
            const [data] = await connection.execute(
                `
        SELECT id, puja_id, devotees, status, created_at
        FROM puja_booking
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `,
                [userId]
            );

            rows = data.map((b) => ({
                booking_type: "puja",
                booking_id: b.id,
                puja_id: b.puja_id,
                devotees: safeJSON(b.devotees, []),
                status: b.status,
                created_at: b.created_at,
            }));
        }

        /* ================= ASTRO BOOKINGS ================= */
        if (type === "astro") {
            const [data] = await connection.execute(
                `
        SELECT id, astro_id, communication_type, duration_minutes, amount,
               booking_status, created_at
        FROM astro_booking
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `,
                [userId]
            );

            rows = data.map((b) => ({
                booking_type: "astro",
                booking_id: b.id,
                astro_id: b.astro_id,
                communication_type: b.communication_type,
                duration_minutes: b.duration_minutes,
                amount: b.amount,
                status: b.booking_status,
                created_at: b.created_at,
            }));
        }

        console.log(rows);


        return res.json({
            success: true,
            page,
            limit,
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error("getMyBookings error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
        });
    }
};



export const getBookingDetails = async (req, res) => {
    const connection = db.promise();

    const { type, id } = req.params

    console.log(type);
    console.log(id);


    try {
        let query = ""
        let params = [id]

        if (type === "puja") {
            query = `
                SELECT 
    pb.*,
    p.name,
    p.image,
    p.price,
    p.puja_date,
    p.start_time,
    py.gateway_order_id,
    py.amount,
    py.payment_status
FROM puja_booking pb
INNER JOIN puja p 
    ON pb.puja_id = p.id
LEFT JOIN payments py 
    ON py.payment_for_id = pb.id
   AND py.payment_for_type = 'puja_booking'
WHERE pb.id = ?
            `
        }
        else if (type === "product") {
            // 1️⃣ Order details
            const [orderRows] = await connection.execute(
                `
        SELECT *
        FROM orders
        WHERE id = ?
        `,
                [id]
            );

            if (!orderRows.length) {
                return res.status(404).json({ message: "Order not found" });
            }

            // 2️⃣ Order items
            const [items] = await connection.execute(
                `
        SELECT 
            product_id,
            name,
            image,
            quantity,
            price,
            shipping_price,
            platform_price,
            tax,
            total_value,
            status
        FROM product_booking
        WHERE order_id = ?
        `,
                [id]
            );

            return res.json({
                ...orderRows[0],
                items,
            });
        }
        else if (type === "astro") {
            query = `
                SELECT ab.*,pn.*,py.*
                FROM astro_booking ab 
                INNER JOIN pandits pn ON ab.astro_id = pn.id
                INNER JOIN payments py ON ab.payment_id = py.id
                WHERE ab.id = ?
            `
        }
        else {
            return res.status(400).json({ message: "Invalid booking type" })
        }

        const [rows] = await connection.execute(query, params)

        if (!rows.length) {
            return res.status(404).json({ message: "Booking not found" })
        }

        res.json(rows[0])

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}
