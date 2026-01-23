// import db from "../utils/db.js";

// export const createPanditAvailable = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = db.promise();

//   try {
//     const { pandit_id, date, start_time, end_time } = req.body;

//     if (!pandit_id || !date || !start_time || !end_time) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     await connection.beginTransaction();

//     const insertQuery = `
//      INSERT INTO pandit_availability
// (pandit_id, date, start_time, end_time)
// VALUES (?, ?, ?, ?)

//     `;

//     await connection.execute(insertQuery, [
//       pandit_id,
//       date,
//       start_time,
//       end_time,
//     ]);

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Pandit availability created successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) {}

//     console.error("Create Pandit Availability Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create Pandit Availability",
//     });
//   }
// };

// export const getAllPanditAvailability = async (req, res) => {
//   const connection = db.promise();

//   try {
//     const [rows] = await connection.execute(`
//       SELECT *
//       FROM pandit_availability
//       ORDER BY date, time_slot
//     `);

//     return res.status(200).json({
//       success: true,
//       count: rows.length,
//       data: rows,
//     });
//   } catch (error) {
//     console.error("Get Pandit Availability Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch Pandit Availability",
//     });
//   }
// };

// export const updatePanditAvailability = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = db.promise();

//   try {
//     const { id } = req.params;
//     const { pandit_id, date, time_slot, is_available } = req.body;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Pandit Availability id is required",
//       });
//     }

//     if (!pandit_id || !date || !time_slot || is_available === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields are missing",
//       });
//     }

//     await connection.beginTransaction();

//     const updateQuery = `
//       UPDATE pandit_availability
//       SET pandit_id = ?, date = ?, time_slot = ?, is_available = ?
//       WHERE id = ?
//     `;

//     const [result] = await connection.execute(updateQuery, [
//       pandit_id,
//       date,
//       time_slot,
//       is_available,
//       id,
//     ]);

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Pandit Availability not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Pandit Availability updated successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) {}

//     console.error("Update Pandit Availability Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update Pandit Availability",
//     });
//   }
// };

// export const deletePanditAvailability = async (req, res) => {
//   if (req?.user?.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: Admin only",
//     });
//   }

//   const connection = db.promise();

//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Pandit Availability id is required",
//       });
//     }

//     await connection.beginTransaction();

//     const [result] = await connection.execute(
//       `DELETE FROM pandit_availability WHERE id = ?`,
//       [id]
//     );

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Pandit Availability not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Pandit Availability deleted successfully",
//     });
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch (_) {}

//     console.error("Delete Pandit Availability Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete Pandit Availability",
//     });
//   }
// };
