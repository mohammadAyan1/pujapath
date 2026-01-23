import db from "../utils/db.js";

export const getSearchData = async (req, res) => {
    try {
        const { search = "" } = req.query;

        // ✅ If search is empty return empty array
        if (!search || search.trim() === "") {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: "Search is empty",
            });
        }

        const keyword = search.trim();

        // ✅ 9 params (same order as query)
        const params = [
            keyword,
            keyword, // temples name/description

            keyword,
            keyword,
            keyword,
            keyword, // pandit name/expertise/language

            keyword,
            keyword, // products name/description

            keyword,
            keyword, // puja name/description
        ];

        const getQuery = `
      (
        SELECT 
          t.id,
          t.name,
          t.image,
          'temple' AS type,
          NULL AS extra_info
        FROM temples t
        WHERE t.status = 'active'
          AND (
            t.name LIKE CONCAT('%', ?, '%')
            OR t.description LIKE CONCAT('%', ?, '%')
          )
      )

      UNION ALL

      (
        SELECT
          pd.id,
          pd.name,
          pd.image,
          'pandit/astro' AS type,
          t.name AS extra_info
        FROM pandits pd
        LEFT JOIN temples t ON pd.temple_id = t.id
        WHERE pd.status = 'active'
          AND (
            pd.name LIKE CONCAT('%', ?, '%')
            OR pd.expertise LIKE CONCAT('%', ?, '%')
            OR pd.language LIKE CONCAT('%', ?, '%') 
            OR pd.type LIKE CONCAT('%', ?, '%')
          )
      )

      UNION ALL

      (
        SELECT
          p.id,
          p.name,
          p.image,
          'product' AS type,
          pc.name AS extra_info
        FROM products p
        LEFT JOIN product_categories pc ON p.product_category_id = pc.id
        WHERE p.status = 'active'
          AND (pc.status = 'active' OR pc.id IS NULL)
          AND (
            p.name LIKE CONCAT('%', ?, '%')
            OR p.description LIKE CONCAT('%', ?, '%')
          )
      )

      UNION ALL

      (
        SELECT
          pu.id,
          pu.name,
          pu.image,
          'puja' AS type,
          puc.name AS extra_info
        FROM puja pu
        LEFT JOIN puja_category puc ON pu.puja_category_id = puc.id
        WHERE pu.status = 'active'
          AND (puc.status = 'active' OR puc.id IS NULL)
          AND (
            pu.name LIKE CONCAT('%', ?, '%')
            OR pu.description LIKE CONCAT('%', ?, '%')
          )
      )

      ORDER BY name ASC
      LIMIT 20
    `;

        const [rows] = await db.promise().execute(getQuery, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.log("Search Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch search results",
            error: error.message,
        });
    }
};
