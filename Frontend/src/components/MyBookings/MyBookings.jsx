import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaBoxOpen, FaOm, FaUserTie } from "react-icons/fa";

const badgeColor = (status) => {



    if (!status) return "bg-gray-100 text-gray-700";
    const s = status.toLowerCase();
    if (s.includes("confirm")) return "bg-green-100 text-green-700";
    if (s.includes("pending")) return "bg-yellow-100 text-yellow-700";
    if (s.includes("cancel")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
};

const typeIcon = (type) => {
    if (type === "product") return <FaBoxOpen className="text-orange-500" />;
    if (type === "puja") return <FaOm className="text-orange-500" />;
    if (type === "astro") return <FaUserTie className="text-orange-500" />;
    return null;
};

const typeTitle = (type) => {
    if (type === "product") return "Product Booking";
    if (type === "puja") return "Puja Booking";
    if (type === "astro") return "Astrology Booking";
    return "Booking";
};

export default function MyBookings() {

    const ImageUrl = import.meta.env.VITE_BACKEND_FOR_URL
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/bookings/my");
            setBookings(res?.data?.data || []);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
                <p className="text-gray-600 mt-1">
                    All your Puja, Product, and Astro bookings in one place.
                </p>

                {/* ✅ Loader */}
                {loading && (
                    <div className="mt-6 bg-white rounded-xl p-6 shadow border">
                        Loading bookings...
                    </div>
                )}

                {/* ✅ No bookings */}
                {!loading && bookings.length === 0 && (
                    <div className="mt-6 bg-white rounded-xl p-6 shadow border text-gray-600">
                        No bookings found.
                    </div>
                )}

                {/* ✅ Bookings List */}
                {!loading && bookings.length > 0 && (
                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                        {bookings.map((b) => (
                            <div
                                key={`${b.booking_type}-${b.booking_id}`}
                                className="bg-white border shadow rounded-xl p-5"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                                            {typeIcon(b.booking_type)}
                                        </div>

                                        <div>
                                            <h2 className="font-semibold text-gray-800">
                                                {typeTitle(b.booking_type)}
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Booking ID: #{b.booking_id}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-semibold ${badgeColor(
                                            b.status
                                        )}`}
                                    >
                                        {b.status}
                                    </span>
                                </div>

                                <div className="mt-4 text-sm text-gray-700 space-y-2">
                                    <p>
                                        <span className="font-semibold">Created:</span>{" "}
                                        {new Date(b.created_at).toLocaleString()}
                                    </p>

                                    {b.booking_type === "product" && (
                                        <>
                                            <p>
                                                <span className="font-semibold">Product:</span>{" "}
                                                {b.name}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Qty:</span>{" "}
                                                {b.quantity}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Total:</span> ₹
                                                {b.total_value}
                                            </p>

                                            {b.image && (
                                                <img
                                                    src={`${ImageUrl}/${b?.image}`}
                                                    alt={b.name}
                                                    className="w-full h-40 object-cover rounded-lg border mt-2"
                                                />
                                            )}
                                        </>
                                    )}

                                    {b.booking_type === "puja" && (
                                        <>
                                            <p>
                                                <span className="font-semibold">Puja ID:</span>{" "}
                                                {b.puja_id}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Devotees:</span>{" "}
                                                {Array.isArray(b.devotees)
                                                    ? b.devotees.length
                                                    : 0}
                                            </p>
                                        </>
                                    )}

                                    {b.booking_type === "astro" && (
                                        <>
                                            <p>
                                                <span className="font-semibold">Astro ID:</span>{" "}
                                                {b.astro_id}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Type:</span>{" "}
                                                {b.communication_type}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Duration:</span>{" "}
                                                {b.duration_minutes} min
                                            </p>
                                            <p>
                                                <span className="font-semibold">Amount:</span> ₹
                                                {b.amount}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
