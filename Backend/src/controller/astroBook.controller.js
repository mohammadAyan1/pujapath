import db from "../utils/db.js";

export const createAstroBooking = async (req, res) => {
  const connection = await db.promise().getConnection();
  try {
    const { astro_id, payment_id, asker } = req.body;
    const user_id = req?.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User must be logged in",
      });
    }

    if (!astro_id || !asker) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const askersJSON = JSON.stringify(asker);
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO astro_booking
      (astro_id, user_id, payment_id, asker)
      VALUES (?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      astro_id,
      user_id,
      payment_id || null,
      askersJSON,
    ]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) { }

    console.error("Create Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Booking",
    });
  } finally {
    connection.release();
  }
};
export const getAllAstroBookinByUser = async (req, res) => {
  const connection = db.promise();
  try {
    const user_id = req?.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "User must be logged in",
      });
    }

    const [rows] = await connection.execute(
      `
      SELECT *
      FROM astro_booking
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get All Astro Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Astro Booking",
    });
  }
};
