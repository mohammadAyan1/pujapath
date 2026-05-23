
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaBoxOpen, FaOm, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE = import.meta.env.VITE_BACKEND_FOR_URL;
const LIMIT = 8;

/* ================= HELPERS ================= */

const badgeColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-700";
    const s = status.toLowerCase();
    if (s.includes("confirm")) return "bg-green-100 text-green-700";
    if (s.includes("pending")) return "bg-yellow-100 text-yellow-700";
    if (s.includes("cancel")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
};

export default function MyBookings() {

    const navigate = useNavigate()

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedType, setSelectedType] = useState("product");

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loaderRef = useRef(null);
    const observerRef = useRef(null);
    const isFetchingRef = useRef(false);

    /* ================= FETCH ================= */

    const fetchBookings = useCallback(async (pageNo) => {
        if (isFetchingRef.current) return;

        try {
            isFetchingRef.current = true;
            setLoading(true);

            const res = await api.get(
                `/bookings/my?type=${selectedType}&page=${pageNo}&limit=${LIMIT}`
            );
            console.log(res?.data);

            const data = res?.data?.data || [];

            setBookings((prev) =>
                pageNo === 1 ? data : [...prev, ...data]
            );

            if (data.length < LIMIT) {
                setHasMore(false);
            }
        } catch {
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [selectedType]);

    /* ================= TAB CHANGE ================= */

    useEffect(() => {
        // reset everything
        setBookings([]);
        setPage(1);
        setHasMore(true);
        isFetchingRef.current = false;

        // disconnect old observer
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        fetchBookings(1);
    }, [selectedType, fetchBookings]);

    /* ================= PAGE CHANGE ================= */

    useEffect(() => {
        if (page === 1) return;
        fetchBookings(page);
    }, [page, fetchBookings]);

    /* ================= INFINITE SCROLL ================= */

    useEffect(() => {
        if (!loaderRef.current || !hasMore) return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    !isFetchingRef.current
                ) {
                    setPage((p) => p + 1);
                }
            },
            { threshold: 0.5 }
        );

        observerRef.current.observe(loaderRef.current);

        return () => observerRef.current?.disconnect();
    }, [hasMore]);

    /* ================= TABS ================= */

    const tabs = useMemo(
        () => [
            { key: "product", label: "Products", icon: <FaBoxOpen /> },
            { key: "puja", label: "Puja", icon: <FaOm /> },
            { key: "astro", label: "Astrology", icon: <FaUserTie /> },
        ],
        []
    );

    const handleShowBookDetailds = (type, id) => {
        navigate(`/booking/detaild/${type}/${id}`)
    }


    /* ================= UI ================= */

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">

                <h1 className="text-2xl font-bold">My Bookings</h1>

                {/* TABS */}
                <div className="flex gap-3 mt-6">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setSelectedType(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
                ${selectedType === t.key
                                    ? "bg-orange-600 text-white"
                                    : "bg-white border text-gray-600"
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* EMPTY */}
                {!loading && bookings.length === 0 && (
                    <div className="mt-6 bg-white p-6 rounded-xl shadow">
                        No bookings found
                    </div>
                )}

                {/* LIST */}
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {bookings.map((b) => {
                        console.log(b)
                        return (
                            <div
                                key={`${b.booking_type}-${b.booking_id}`}
                                className="bg-white p-5 rounded-xl shadow border"
                                onClick={() => handleShowBookDetailds(b.booking_type, b.booking_id)}
                            >
                                <div className="flex justify-between">
                                    <h2 className="font-semibold capitalize">
                                        {b.booking_type} Booking
                                    </h2>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full ${badgeColor(b.status)}`}
                                    >
                                        {b.status}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                    #{b.booking_id} · {new Date(b.created_at).toLocaleString()}
                                </p>

                                {/* {b.booking_type === "product" && (
                                    <>
                                        <p className="mt-2 font-semibold">{b.name}</p>
                                        <p>Qty: {b.quantity}</p>
                                        <p>Total: ₹{b.total_value}</p>
                                        {b.image && (
                                            <img
                                                src={`${IMAGE_BASE}/${b.image}`}
                                                className="h-40 w-full object-cover rounded mt-2"
                                                alt=""
                                            />
                                        )}
                                    </>
                                )} */}

                                <p>Payment method : {b?.payment_method}</p>

                                {b.booking_type === "product" && (
                                    <>
                                        <p className="mt-2 font-semibold">
                                            Order Items: {b.items.length}
                                        </p>

                                        <p>Total Amount: ₹{b.total_amount}</p>

                                        {/* <div className="grid grid-cols-2 gap-2 mt-2">
                                            {b.items.map((item, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`${IMAGE_BASE}/${item.image}`}
                                                    className="h-28 w-full object-cover rounded"
                                                    alt={item.name}
                                                />
                                            ))}
                                        </div> */}
                                    </>
                                )}


                                {b.booking_type === "puja" && (
                                    <p className="mt-2">
                                        Devotees: {b.devotees?.length || b?.devotees?.devotees?.length || 0}
                                    </p>
                                )}

                                {b.booking_type === "astro" && (
                                    <>
                                        <p>Type: {b.communication_type}</p>
                                        <p>Duration: {b.duration_minutes} min</p>
                                        <p>Amount: ₹{b.amount}</p>
                                    </>
                                )}
                            </div>
                        )
                    })}

                </div>

                {/* LOADER */}
                {hasMore && (
                    <div ref={loaderRef} className="h-12 flex justify-center mt-6">
                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin h-5 w-5 border-b-2 border-orange-600 rounded-full" />
                                Loading…
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
