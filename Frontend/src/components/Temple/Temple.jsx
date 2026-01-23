import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

const Temple = () => {
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Infinite scroll
    const [page, setPage] = useState(1);
    const limit = 8;
    const [hasMore, setHasMore] = useState(true);

    // ✅ Filters
    const [fromTime, setFromTime] = useState(""); // ex "06:00"
    const [toTime, setToTime] = useState(""); // ex "12:00"

    const loaderRef = useRef(null);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return "/no-image.png";
        if (imgPath.startsWith("http")) return imgPath;
        return `${BASE_URL_IMAGE}/${imgPath}`;
    };

    /* ✅ Fetch temples (chunks) */
    const fetchTemples = async (pageNo = 1) => {
        try {
            setLoading(true);

            let url = `/temple?status=active&page=${pageNo}&limit=${limit}`;

            // ✅ Add time filter only if both are selected
            if (fromTime && toTime) {
                url += `&from_time=${fromTime}&to_time=${toTime}`;
            }

            const res = await api.get(url);

            if (res?.data?.success) {
                const newData = res?.data?.data || [];

                setTemples((prev) =>
                    pageNo === 1 ? newData : [...prev, ...newData]
                );

                if (newData.length < limit) {
                    setHasMore(false);
                }
            } else {
                toast.error("Failed to fetch temples");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch temples");
        } finally {
            setLoading(false);
        }
    };

    /* ✅ First Load + When Filter Changes */
    useEffect(() => {
        setTemples([]);
        setPage(1);
        setHasMore(true);
        fetchTemples(1);
    }, [fromTime, toTime]);

    /* ✅ Infinite scroll observer */
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

    /* ✅ Load next page */
    useEffect(() => {
        if (page === 1) return;
        fetchTemples(page);
    }, [page]);

    return (
        <div className="min-h-[calc(100vh-120px)] bg-gray-50">
            {/* ✅ FILTERS */}
            <div className="max-w-7xl mx-auto px-4 pb-4 pt-4">
                <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <h2 className="font-bold text-lg text-gray-800">Temples</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* ✅ From Time */}
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">
                                Opening From
                            </label>
                            <input
                                type="time"
                                value={fromTime}
                                onChange={(e) => setFromTime(e.target.value)}
                                className="w-full sm:w-[170px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>

                        {/* ✅ To Time */}
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">
                                Closing Till
                            </label>
                            <input
                                type="time"
                                value={toTime}
                                onChange={(e) => setToTime(e.target.value)}
                                className="w-full sm:w-[170px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>

                        {/* ✅ Reset Button */}
                        <button
                            onClick={() => {
                                setFromTime("");
                                setToTime("");
                            }}
                            className="h-[42px] mt-5 sm:mt-0 sm:self-end px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* ✅ Validation message */}
                {fromTime && !toTime && (
                    <p className="text-xs text-red-500 mt-2">
                        Please select closing time also
                    </p>
                )}
                {!fromTime && toTime && (
                    <p className="text-xs text-red-500 mt-2">
                        Please select opening time also
                    </p>
                )}
            </div>

            {/* ✅ TEMPLE GRID */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {temples.length === 0 && !loading ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No temples found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {temples.map((temple) => (
                                <div
                                    key={temple.id}
                                    className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                                >
                                    <div className="h-48 w-full bg-gray-100 overflow-hidden">
                                        <img
                                            src={getImageUrl(temple.image)}
                                            alt={temple.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.src = "/no-image.png";
                                            }}
                                        />
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <h2 className="text-base font-semibold text-gray-800 line-clamp-2">
                                            {temple.name}
                                        </h2>

                                        <p className="text-sm text-gray-600 mt-1">
                                            {temple.area}, {temple.city}, {temple.state}
                                        </p>

                                        <div className="mt-3 flex justify-between text-sm text-gray-700">
                                            <div>
                                                <p className="text-xs text-gray-500">Opening</p>
                                                <p className="font-medium">{temple.opening_time}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Closing</p>
                                                <p className="font-medium">{temple.closing_time}</p>
                                            </div>
                                        </div>

                                        {temple.has_live === 1 && temple.live_url && (
                                            <a
                                                href={temple.live_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 text-sm text-orange-600 font-medium hover:underline"
                                            >
                                                Live Darshan →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ✅ Loader trigger */}
                        <div ref={loaderRef} className="h-10 mt-10 flex justify-center">
                            {loading && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                                    Loading more...
                                </div>
                            )}
                        </div>

                        {/* ✅ End message */}
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

export default Temple;
