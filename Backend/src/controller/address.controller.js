import db from "../utils/db.js";
export const createAddress = async (req, res) => {

    try {
        const user_id = req?.user?.id
        if (!user_id) {
            return res.status(403).json({
                message: "User ID Is Required",
                success: false
            })
        }
        const connection = await db.promise().getConnection();

        const {
            full_name,
            phone_number,
            address,
            city,
            state,
            pincode,
        } = req.body;


        if (!full_name || !phone_number || !address || !city || !state || !pincode) {
            return res.status(403).json({
                message: "Required fields are missing",
                success: false
            })
        }
        await connection.beginTransaction();


        const insertQuery = `
        INSERT INTO addresses ( 
        full_name,
        phone_number,
        address,
        city,
        state,
        pincode,
        user_id 
        ) VALUES (?,?,?,?,?,?,?)`



        await connection.execute(insertQuery, [
            full_name,
            phone_number,
            address,
            city,
            state,
            pincode,
            user_id
        ]);


        await connection.commit();


        return res.status(201).json({
            success: true,
            message: "Address created successfully",
        });


    } catch (error) {
        await connection.rollback();

        console.error("Create Address Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create Address",
        });
    } finally {
        connection.release()
    }
}


export const getAddress = async (req, res) => {
    const connection = db.promise()
    try {

        const userId = req?.user?.id
        if (!userId) {
            return res.status(403).json({
                message: "User ID Is Required",
                success: false
            })
        }

        const getQuery = `SELECT * FROM addresses WHERE user_id =?`


        const [rows] = await connection.execute(getQuery, [userId])

        if (!rows.length > 0) {
            return res.status(500).json({
                success: false,
                message: "Address Not Found With this User",
            });
        }

        res.status(200).json({
            message: "fetch address Address successfully",
            success: true,
            data: rows
        })

    } catch (error) {
        // ❌ Rollback on error
        await connection.rollback();

        console.error("Failed to Fetch Address Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch Address",
        });
    }
}