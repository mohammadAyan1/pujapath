// import React, { useEffect, useMemo, useRef, useState } from "react";
// import api from "../../api/axios";
// import { toast } from "react-toastify";
// import { FaClock } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// const BASE_URL_IMAGE =
//   import.meta.env.VITE_BACKEND_FOR_URL

// const Puja = () => {
//   const navigate = useNavigate()
//   const [puja, setPuja] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // ✅ Infinite scroll pagination
//   const [page, setPage] = useState(1);
//   const limit = 8;
//   const [hasMore, setHasMore] = useState(true);

//   // ✅ Filters
//   const [sortBy, setSortBy] = useState("default");
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [selectedTemple, setSelectedTemple] = useState("all");

//   // ✅ Dropdown data
//   const [categoriesData, setCategoriesData] = useState([]);
//   const [templesData, setTemplesData] = useState([]);

//   const loaderRef = useRef(null);

//   const getImageUrl = (imgPath) => {
//     if (!imgPath) return "/no-image.png";
//     if (imgPath.startsWith("http")) return imgPath;
//     return `${BASE_URL_IMAGE}/${imgPath}`;
//   };

//   // ✅ Fetch puja list
//   const fetchPuja = async (pageNo = 1) => {
//     try {
//       setLoading(true);

//       // ✅ Build query
//       let url = `/puja?status=active&page=${pageNo}&limit=${limit}&sortby=${sortBy}`;

//       // ✅ category filter
//       if (selectedCategory !== "all") {
//         url += `&category=${selectedCategory}`;
//       }

//       // ✅ temple filter
//       if (selectedTemple !== "all") {
//         url += `&temple_id=${selectedTemple}`;
//       }

//       const res = await api.get(url);

//       if (res?.data?.success) {
//         const newData = res?.data?.data || [];

//         setPuja((prev) => (pageNo === 1 ? newData : [...prev, ...newData]));

//         if (newData.length < limit) setHasMore(false);
//       } else {
//         toast.error("Failed to fetch puja");
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to fetch puja");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Fetch puja categories
//   const fetchPujaCategories = async () => {
//     try {
//       const res = await api.get("/puja-category?status=active");
//       if (res?.data?.success) {
//         setCategoriesData(res?.data?.data || []);
//       }
//     } catch (error) {
//       toast.error("Failed to fetch puja categories");
//     }
//   };

//   // ✅ Fetch temples
//   const fetchAllTemples = async () => {
//     try {
//       const res = await api.get("/temple?status=active");
//       if (res?.data?.success) {
//         setTemplesData(res?.data?.data || []);
//       }
//     } catch (error) {
//       toast.error("Failed to fetch temples");
//     }
//   };

//   // ✅ First time load dropdown data
//   useEffect(() => {
//     fetchPujaCategories();
//     fetchAllTemples();
//   }, []);

//   // ✅ When filters change -> reset pagination
//   useEffect(() => {
//     setPage(1);
//     setHasMore(true);
//     fetchPuja(1);
//   }, [selectedCategory, selectedTemple, sortBy]);

//   // ✅ Infinite scroll observer
//   useEffect(() => {
//     if (!loaderRef.current) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         const first = entries[0];
//         if (first.isIntersecting && hasMore && !loading) {
//           setPage((prev) => prev + 1);
//         }
//       },
//       { threshold: 1 }
//     );

//     observer.observe(loaderRef.current);
//     return () => observer.disconnect();
//   }, [hasMore, loading]);

//   // ✅ When page increases -> load next page
//   useEffect(() => {
//     if (page === 1) return;
//     fetchPuja(page);
//   }, [page]);

//   // ✅ Build categories list
//   const categories = useMemo(() => {
//     const cats = categoriesData.map((c) => ({ id: c.id, name: c.name }));
//     return ["all", ...cats];
//   }, [categoriesData]);

//   // ✅ Build temple list
//   const temples = useMemo(() => {
//     const temp = templesData.map((t) => ({
//       id: t.id,
//       name: t.name,
//       city: t.city,
//       state: t.state,
//     }));
//     return ["all", ...temp];
//   }, [templesData]);

//   return (
//     <div className="min-h-[calc(100vh-120px)] bg-gray-50">
//       {/* ✅ FILTERS */}
//       <div className="max-w-7xl mx-auto px-4 pb-4 pt-5">
//         <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
//           <div className="flex flex-col md:flex-row gap-3 w-full">
//             {/* ✅ Temple Filter */}
//             <select
//               value={selectedTemple}
//               onChange={(e) => setSelectedTemple(e.target.value)}
//               className="w-full md:w-[260px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
//             >
//               {temples.map((t) => (
//                 <option key={t?.id || t} value={t?.id || "all"}>
//                   {t === "all"
//                     ? "All Temples"
//                     : `${t?.name} (${t?.city || ""})`}
//                 </option>
//               ))}
//             </select>

//             {/* ✅ Category Filter */}
//             <select
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
//             >
//               {categories.map((cat) => (
//                 <option key={cat?.id || cat} value={cat?.id || "all"}>
//                   {cat === "all" ? "All Puja Categories" : cat?.name}
//                 </option>
//               ))}
//             </select>

//             {/* ✅ Sort */}
//             <select
//               value={sortBy}
//               onChange={(e) => setSortBy(e.target.value)}
//               className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
//             >
//               <option value="default">Sort: Default</option>
//               <option value="latest">Latest</option>
//               <option value="price_low">Price: Low to High</option>
//               <option value="price_high">Price: High to Low</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* ✅ PUJA GRID */}
//       <div className="max-w-7xl mx-auto px-4 pb-10">
//         {puja.length === 0 && !loading ? (
//           <div className="text-center py-16 bg-white rounded-lg shadow">
//             <p className="text-gray-500">No puja found</p>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
//               {puja.map((item) => {
//                 const scheduleType = item.schedule_type || "date";

//                 const scheduleText =
//                   scheduleType === "daily"
//                     ? "Daily"
//                     : scheduleType === "weekly"
//                       ? `Weekly: ${item.schedule_days
//                         ? JSON.parse(item.schedule_days || "[]")
//                           .map((d) => d?.toUpperCase())
//                           .join(", ")
//                         : "N/A"
//                       }`
//                       : item.puja_date
//                         ? `Date: ${new Date(item.puja_date).toLocaleDateString()}`
//                         : "Date: N/A";

//                 return (
//                   <div
//                     key={item.id}
//                     className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
//                   >
//                     <div className="h-48 w-full bg-gray-100 overflow-hidden">
//                       <img
//                         src={getImageUrl(item.image)}
//                         alt={item.name}
//                         className="h-full w-full object-cover"
//                         onError={(e) => (e.target.src = "/no-image.png")}
//                       />
//                     </div>

//                     <div className="p-4 flex flex-col flex-1">
//                       {/* Category */}
//                       {item.category_name && (
//                         <p className="text-xs text-gray-500 mb-1">{item.category_name}</p>
//                       )}

//                       {/* Name */}
//                       <h2 className="text-base font-semibold text-gray-800 line-clamp-2">
//                         {item.name}
//                       </h2>

//                       {/* Temple */}
//                       {item.temple_name && (
//                         <p className="text-xs text-gray-500 mt-1">
//                           Temple: {item.temple_name}
//                         </p>
//                       )}

//                       {/* Schedule */}
//                       <p className="text-xs text-gray-600 mt-2">
//                         <span className="font-medium">Schedule:</span> {scheduleText}
//                       </p>

//                       {/* Duration + Price */}
//                       <div className="mt-3 flex items-center justify-between">
//                         <p className="text-lg font-bold text-orange-600">₹{item.price}</p>

//                         {item.duration && (
//                           <div className="flex items-center gap-1 text-xs text-gray-600">
//                             <FaClock />
//                             {item.duration} min
//                           </div>
//                         )}
//                       </div>

//                       <button
//                         onClick={() => navigate(`/puja-checkout/${item.id}`)}
//                         className="mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
//                       >
//                         Book Now
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}

//             </div>

//             {/* ✅ LOADER TRIGGER */}
//             <div ref={loaderRef} className="h-10 mt-10 flex justify-center">
//               {loading && (
//                 <div className="flex items-center gap-2 text-gray-500">
//                   <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
//                   Loading more...
//                 </div>
//               )}
//             </div>

//             {/* ✅ END MESSAGE */}
//             {!hasMore && (
//               <p className="text-center text-gray-500 mt-6">
//                 You have reached the end ✅
//               </p>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Puja;



import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaClock, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

const Puja = () => {
  const navigate = useNavigate();
  const [puja, setPuja] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Infinite scroll pagination
  const [page, setPage] = useState(1);
  const limit = 8;
  const [hasMore, setHasMore] = useState(true);

  // ✅ Filters
  const [sortBy, setSortBy] = useState("default");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemple, setSelectedTemple] = useState("all");

  // ✅ Dropdown data
  const [categoriesData, setCategoriesData] = useState([]);
  const [templesData, setTemplesData] = useState([]);

  const loaderRef = useRef(null);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return "/no-image.png";
    if (imgPath.startsWith("http")) return imgPath;
    const cleanPath = imgPath.replaceAll("\\", "/");
    return `${BASE_URL_IMAGE}/${cleanPath}`;
  };

  // ✅ Helper: Safely parse schedule_days (works with JSON array or "mon,thu")
  const parseScheduleDays = (schedule_days) => {
    if (!schedule_days) return [];

    // If already array
    if (Array.isArray(schedule_days)) return schedule_days;

    // If it's a string
    if (typeof schedule_days === "string") {
      const str = schedule_days.trim();
      if (!str) return [];

      // Try JSON parse first
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        // Not JSON => fallback to comma separated string
        return str.split(",").map((x) => x.trim()).filter(Boolean);
      }
    }

    return [];
  };

  // ✅ Fetch puja list
  const fetchPuja = async (pageNo = 1) => {
    try {
      setLoading(true);

      // ✅ Build query
      let url = `/puja?status=active&page=${pageNo}&limit=${limit}&sortby=${sortBy}`;

      // ✅ category filter
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }

      // ✅ temple filter
      if (selectedTemple !== "all") {
        url += `&temple_id=${selectedTemple}`;
      }

      const res = await api.get(url);

      if (res?.data?.success) {
        const newData = res?.data?.data || [];

        setPuja((prev) => (pageNo === 1 ? newData : [...prev, ...newData]));

        if (newData.length < limit) setHasMore(false);
      } else {
        toast.error("Failed to fetch puja");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch puja");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch puja categories
  const fetchPujaCategories = async () => {
    try {
      const res = await api.get("/puja-category?status=active");
      if (res?.data?.success) {
        setCategoriesData(res?.data?.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch puja categories");
    }
  };

  // ✅ Fetch temples
  const fetchAllTemples = async () => {
    try {
      const res = await api.get("/temple?status=active");
      if (res?.data?.success) {
        setTemplesData(res?.data?.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch temples");
    }
  };

  // ✅ First time load dropdown data
  useEffect(() => {
    fetchPujaCategories();
    fetchAllTemples();
  }, []);

  // ✅ When filters change -> reset pagination
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPuja(1);
  }, [selectedCategory, selectedTemple, sortBy]);

  // ✅ Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  // ✅ When page increases -> load next page
  useEffect(() => {
    if (page === 1) return;
    fetchPuja(page);
  }, [page]);

  // ✅ Build categories list
  const categories = useMemo(() => {
    const cats = categoriesData.map((c) => ({ id: c.id, name: c.name }));
    return ["all", ...cats];
  }, [categoriesData]);

  // ✅ Build temple list
  const temples = useMemo(() => {
    const temp = templesData.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city,
      state: t.state,
    }));
    return ["all", ...temp];
  }, [templesData]);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* ✅ FILTERS */}
      <div className="max-w-7xl mx-auto px-4 pb-4 pt-5">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            {/* ✅ Temple Filter */}
            <select
              value={selectedTemple}
              onChange={(e) => setSelectedTemple(e.target.value)}
              className="w-full md:w-[260px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {temples.map((t) => (
                <option key={t?.id || t} value={t?.id || "all"}>
                  {t === "all" ? "All Temples" : `${t?.name} (${t?.city || ""})`}
                </option>
              ))}
            </select>

            {/* ✅ Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {categories.map((cat) => (
                <option key={cat?.id || cat} value={cat?.id || "all"}>
                  {cat === "all" ? "All Puja Categories" : cat?.name}
                </option>
              ))}
            </select>

            {/* ✅ Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="default">Sort: Default</option>
              <option value="latest">Latest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ✅ PUJA GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {puja.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500">No puja found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {puja.map((item) => {
                const scheduleType = item.schedule_type || "date";
                const daysArray = parseScheduleDays(item.schedule_days);

                const scheduleText =
                  scheduleType === "daily"
                    ? "Daily"
                    : scheduleType === "weekly"
                      ? `Weekly: ${daysArray.length
                        ? daysArray.map((d) => d.toUpperCase()).join(", ")
                        : "N/A"
                      }`
                      : item.puja_date
                        ? `Date: ${new Date(item.puja_date).toLocaleDateString()}`
                        : "Date: N/A";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                  >
                    <div className="h-48 w-full bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/puja/${item.id}`)}

                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => (e.target.src = "/no-image.png")}
                      />
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      {/* Category */}
                      {item.category_name && (
                        <p className="text-xs text-gray-500 mb-1">
                          {item.category_name}
                        </p>
                      )}

                      {/* Name */}
                      <h2 className="text-base font-semibold text-gray-800 line-clamp-2">
                        {item.name}
                      </h2>

                      {/* Temple */}
                      {item.temple_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Temple: {item.temple_name}
                        </p>
                      )}

                      {/* ✅ Schedule */}
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-400" />
                        <span className="font-medium">Schedule:</span>{" "}
                        {scheduleText}
                      </p>

                      {/* Duration + Price */}
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-lg font-bold text-orange-600">
                          ₹{item.price}
                        </p>

                        {item.duration && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <FaClock />
                            {item.duration} min
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/puja-checkout/${item.id}`)}
                        className="mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ LOADER TRIGGER */}
            <div ref={loaderRef} className="h-10 mt-10 flex justify-center">
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  Loading more...
                </div>
              )}
            </div>

            {/* ✅ END MESSAGE */}
            {!hasMore && (
              <p className="text-center text-gray-500 mt-6">
                You have reached the end ✅
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Puja;
