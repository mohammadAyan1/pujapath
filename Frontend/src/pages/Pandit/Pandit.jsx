import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

const Pandit = () => {
    const [pandits, setPandits] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Infinite pagination
    const [page, setPage] = useState(1);
    const limit = 8;
    const [hasMore, setHasMore] = useState(true);

    // ✅ Filters
    const [selectedTemple, setSelectedTemple] = useState("all");
    const [selectedExpertise, setSelectedExpertise] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("latest");

    // ✅ Dropdown data
    const [templesData, setTemplesData] = useState([]);

    const loaderRef = useRef(null);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return "/no-image.png";
        if (imgPath.startsWith("http")) return imgPath;
        return `${BASE_URL_IMAGE}/${imgPath}`;
    };

    // ✅ Fetch temples for filter dropdown
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

    // ✅ Fetch pandits with filters + pagination
    const fetchPandits = async (pageNo = 1) => {
        try {
            setLoading(true);

            let url = `/pandit?page=${pageNo}&limit=${limit}&sortby=${sortBy}&status=active`;

            if (selectedTemple !== "all") {
                url += `&temple_id=${selectedTemple}`;
            }

            if (selectedType !== "all") {
                url += `&type=${selectedType}`;
            }

            if (selectedExpertise !== "all") {
                url += `&expertise=${encodeURIComponent(selectedExpertise)}`;
            }

            const res = await api.get(url);

            if (res?.data?.success) {
                const newData = res?.data?.data || [];

                setPandits((prev) =>
                    pageNo === 1 ? newData : [...prev, ...newData]
                );

                if (newData.length < limit) setHasMore(false);
            } else {
                toast.error("Failed to fetch pandits");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch pandits");
        } finally {
            setLoading(false);
        }
    };

    // ✅ First load dropdowns
    useEffect(() => {
        fetchAllTemples();
    }, []);

    // ✅ When filters change -> reset pagination & fetch again
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchPandits(1);
    }, [selectedTemple, selectedExpertise, selectedType, sortBy]);

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

    // ✅ When page increases -> fetch next page
    useEffect(() => {
        if (page === 1) return;
        fetchPandits(page);
    }, [page]);

    // ✅ Temple dropdown list
    const temples = useMemo(() => {
        const temp = templesData.map((t) => ({
            id: t.id,
            name: t.name,
            city: t.city,
            state: t.state,
        }));
        return ["all", ...temp];
    }, [templesData]);

    // ✅ Expertise list (dynamic from currently loaded pandits)
    // ⚠️ If you want ALL expertise from DB, I will give a separate API for it
    const expertiseList = useMemo(() => {
        const set = new Set();
        pandits.forEach((p) => {
            if (p?.expertise) set.add(p.expertise);
        });
        return ["all", ...Array.from(set)];
    }, [pandits]);

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
                                    {t === "all"
                                        ? "All Temples"
                                        : `${t?.name} (${t?.city || ""})`}
                                </option>
                            ))}
                        </select>

                        {/* ✅ Type Filter */}
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="pandit">Pandit</option>
                            <option value="astro">Astrologer</option>
                        </select>

                        {/* ✅ Expertise Filter */}
                        <select
                            value={selectedExpertise}
                            onChange={(e) => setSelectedExpertise(e.target.value)}
                            className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            {expertiseList.map((ex) => (
                                <option key={ex} value={ex}>
                                    {ex === "all" ? "All Expertise" : ex}
                                </option>
                            ))}
                        </select>

                        {/* ✅ Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full md:w-[220px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="latest">Sort: Latest</option>
                            <option value="rating_high">Rating: High to Low</option>
                            <option value="rating_low">Rating: Low to High</option>
                            <option value="exp_high">Experience: High to Low</option>
                            <option value="exp_low">Experience: Low to High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ✅ GRID */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {pandits.length === 0 && !loading ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No pandit found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {pandits.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                                >
                                    {/* ✅ Image */}
                                    <div className="h-48 w-full bg-gray-100 overflow-hidden">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => (e.target.src = "/no-image.png")}
                                        />
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        {/* ✅ Type Badge */}
                                        <div className="flex justify-between items-start gap-2">
                                            <h2 className="text-base font-semibold text-gray-800 line-clamp-2">
                                                {item.name}
                                            </h2>

                                            <span
                                                className={`px-2 py-1 rounded text-xs font-semibold ${item.type === "astro"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {item.type?.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* ✅ Temple */}
                                        {item.temple_name && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Temple: {item.temple_name}
                                            </p>
                                        )}

                                        {/* ✅ Expertise */}
                                        {item.expertise && (
                                            <p className="text-sm text-gray-700 mt-2">
                                                <span className="font-semibold">Expertise:</span>{" "}
                                                {item.expertise}
                                            </p>
                                        )}

                                        {/* ✅ Language */}
                                        {item.language && (
                                            <p className="text-sm text-gray-700 mt-1">
                                                <span className="font-semibold">Language:</span>{" "}
                                                {item.language}
                                            </p>
                                        )}

                                        {/* ✅ Experience + Rating */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {item.experience || 0} yrs exp
                                            </p>

                                            <span className="text-sm font-semibold text-green-600">
                                                ⭐ {Number(item.rating || 0).toFixed(1)}
                                            </span>
                                        </div>


                                        <div className="mt-2">
                                            {item.is_free == 1 ? (
                                                <p className="text-green-600 font-semibold text-sm">✅ FREE</p>
                                            ) : (
                                                <p className="text-orange-600 font-semibold text-sm">
                                                    ₹{item.price_per_minute}/min
                                                </p>
                                            )}
                                        </div>


                                        <button className="mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium">
                                            Book Pandit
                                        </button>
                                    </div>
                                </div>
                            ))}
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

export default Pandit;
