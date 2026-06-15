import db from "../utils/db.js";
import { getCache, setCache } from "../utils/cache.js";


export const getHomeData = async (req, res) => {
  try {


    ////////////////
    const cachedHome =
      await getCache("home_page");

    if (cachedHome) {

      console.log("Home Data From Redis");

      return res.status(200).json({
        success: true,
        data: cachedHome,
        asd: "from redis "
      });

    }
    ////////////////////
    const connection = db.promise();
    // const connection = db;

    // ✅ Temples
    const [temples] = await connection.execute(`
      SELECT id, name, state, city, area, opening_time, closing_time,
             has_live, live_url, image
      FROM temples
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // ✅ Pujas (latest)
    const [pujas] = await connection.execute(`
      SELECT p.id, p.name, p.image, p.price, p.duration, p.slot,
             p.puja_date, p.start_time, p.description, p.schedule_type,
             t.name AS temple_name, t.city AS temple_city, t.state AS temple_state
      FROM puja p
      JOIN temples t ON t.id = p.temple_id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    // ✅ Pandits + Astrologers
    const [pandits] = await connection.execute(`
      SELECT id, name, image, expertise, experience, language, rating,
             is_free, price_per_minute, communication, is_available, type
      FROM pandits
      WHERE status = 'active'
      ORDER BY rating DESC
      LIMIT 10
    `);

    // ✅ Products
    const [products] = await connection.execute(`
      SELECT id, name, price, stock, image, description
      FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // ✅ RECOMMENDED SECTION ✅
    // Pandits: best rating + available
    const [recommendedPandits] = await connection.execute(`
      SELECT id, name, image, expertise, experience, language, rating,
             is_free, price_per_minute, communication, is_available, type
      FROM pandits
      WHERE status = 'active'
      ORDER BY is_available DESC, rating DESC, experience DESC
      LIMIT 6
    `);

    // Pujas: cheapest + trending (latest)
    const [recommendedPujas] = await connection.execute(`
      SELECT p.id, p.name, p.image, p.price, p.duration, p.slot,
             p.puja_date, p.start_time, p.description, p.schedule_type,
             t.name AS temple_name, t.city AS temple_city, t.state AS temple_state
      FROM puja p
      JOIN temples t ON t.id = p.temple_id
      WHERE p.status = 'active'
      ORDER BY p.price ASC, p.created_at DESC
      LIMIT 6
    `);

    // Products: in stock + cheapest
    const [recommendedProducts] = await connection.execute(`
      SELECT id, name, price, stock, image, description
      FROM products
      WHERE status = 'active'
        AND stock > 0
      ORDER BY price ASC, created_at DESC
      LIMIT 6
    `);


    //////////////

    const homeData = {
      temples,
      pujas,
      pandits,
      products,
      recommended: {
        pandits: recommendedPandits,
        pujas: recommendedPujas,
        products: recommendedProducts,
      },
    };

    await setCache(
      "home_page",
      homeData,
      300
    );

    /////////////

    // return res.status(200).json({
    //   success: true,
    //   data: {
    //     temples,
    //     pujas,
    //     pandits,
    //     products,
    //     recommended: {
    //       pandits: recommendedPandits,
    //       pujas: recommendedPujas,
    //       products: recommendedProducts,
    //     },
    //   },
    // });

    return res.status(200).json({
      success: true,
      data: homeData,
      asd: "from redis "
    });


  } catch (error) {
    console.log("Home Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load home data",
    });
  }
};
