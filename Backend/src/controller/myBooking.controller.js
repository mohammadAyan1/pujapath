import db from "../utils/db.js";

const safeJSON = (val, fallback) => {
    try {
        if (!val) return fallback;

        // ✅ if already object/array, return directly
        if (typeof val === "object") return val;

        // ✅ if string, parse it
        if (typeof val === "string") return JSON.parse(val);

        return fallback;
    } catch (err) {
        return fallback;
    }
};

export const getMyAllBookings = async (req, res) => {
    const connection = db.promise();

    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        // ✅ PUJA BOOKING
        const [pujaBookings] = await connection.execute(
            `SELECT 
        id,
        puja_id,
        user_id,
        devotees,
        payment_id,
        status,
        created_at,
        updated_at
      FROM puja_booking
      WHERE user_id = ?
      ORDER BY created_at DESC`,
            [userId]
        );

        // ✅ PRODUCT BOOKING
        const [productBookings] = await connection.execute(
            `SELECT
        id,
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
      FROM product_booking
      WHERE user_id = ?
      ORDER BY created_at DESC`,
            [userId]
        );

        // ✅ ASTRO BOOKING
        const [astroBookings] = await connection.execute(
            `SELECT
        id,
        astro_id,
        user_id,
        payment_id,
        asker,
        communication_type,
        duration_minutes,
        amount,
        booking_status,
        created_at,
        updated_at
      FROM astro_booking
      WHERE user_id = ?
      ORDER BY created_at DESC`,
            [userId]
        );

        // ✅ Format into one list (FIXED JSON PARSING)
        const formattedPuja = pujaBookings.map((b) => ({
            booking_type: "puja",
            booking_id: b.id,
            status: b.status,
            created_at: b.created_at,
            updated_at: b.updated_at,
            payment_id: b.payment_id,
            puja_id: b.puja_id,

            // ✅ FIX HERE
            devotees: safeJSON(b.devotees, []),
        }));

        const formattedProduct = productBookings.map((b) => ({
            booking_type: "product",
            booking_id: b.id,
            status: b.status,
            created_at: b.created_at,
            updated_at: b.updated_at,
            payment_id: b.payment_id,
            product_id: b.product_id,
            name: b.name,
            image: b.image,
            description: b.description,
            quantity: b.quantity,
            total_value: b.total_value,
            shipping_price: b.shipping_price,
            platform_price: b.platform_price,
            tax: b.tax,
            payment_method: b.payment_method,
        }));

        const formattedAstro = astroBookings.map((b) => ({
            booking_type: "astro",
            booking_id: b.id,
            status: b.booking_status,
            created_at: b.created_at,
            updated_at: b.updated_at,
            payment_id: b.payment_id,
            astro_id: b.astro_id,
            communication_type: b.communication_type,
            duration_minutes: b.duration_minutes,
            amount: b.amount,

            // ✅ FIX HERE
            asker: safeJSON(b.asker, {}),
        }));

        // ✅ Merge all
        const allBookings = [...formattedPuja, ...formattedProduct, ...formattedAstro];

        // ✅ Sort latest first
        allBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return res.json({
            success: true,
            total: allBookings.length,
            data: allBookings,
        });
    } catch (error) {
        console.log("getMyAllBookings error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching bookings",
            error: error.message,
        });
    }
};
