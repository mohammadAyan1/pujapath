import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

const IMAGE_BASE = import.meta.env.VITE_BACKEND_FOR_URL;

const imgUrl = (path) =>
    // path ? `${IMAGE_BASE}/${path.replaceAll("\\", "/")}` : "/no-image.png";
    path ? `${IMAGE_BASE}${path.replaceAll("\\", "/")}` : "/no-image.png";

const BookingDetails = () => {
    const { type, id } = useParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!type || !id) return;

        const fetchBookingDetails = async () => {
            try {
                const res = await api.get(`/bookings/details/${type}/${id}`);
                setBooking(res?.data);

                console.log(res?.data);

            } catch (err) {
                console.error(err);
                setError("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [type, id]);

    if (loading) return <div className="p-6">Loading…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!booking) return null;

    /* ========================================================= */

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Booking Details</h1>

            {/* ===================== PUJA ===================== */}
            {type === "puja" && (
                <div className="bg-white rounded-lg shadow p-5 space-y-4">
                    <h2 className="text-lg font-semibold">Puja Booking</h2>

                    <div className="flex gap-4">
                        <img
                            src={imgUrl(booking?.image)}
                            alt={booking?.name}
                            className="w-32 h-32 object-cover rounded"
                        />

                        <div>
                            <p className="font-semibold text-lg">{booking?.devotees?.puja?.name}</p>
                            <p>Price: ₹{booking?.devotees?.puja?.price}</p>
                            <p>Date: {booking?.devotees?.puja?.puja_date ?? "Scheduled"}</p>
                            <p>Start Time: {booking?.devotees?.puja?.start_time}</p>
                            <p>Schedule Type: {booking?.devotees?.puja?.schedule_type}</p>
                            <p>
                                Schedule Days: {booking?.devotees?.puja?.schedule_days?.join(", ")}
                            </p>

                            <p>Status: {booking?.status}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mt-4">Devotees</h3>
                        <ul className="list-disc ml-5">
                            {booking?.devotees?.devotees?.map((d, i) => (
                                <li key={i}>
                                    {d?.name} (Person #{d?.person_no})
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t pt-4 text-sm text-gray-600">
                        Payment ID: {booking?.payment_id} <br />
                        Amount Paid: ₹{booking?.amount} <br />
                        Payment Status: {booking?.payment_status}
                    </div>
                </div>
            )}

            {/* ===================== PRODUCT ===================== */}
            {type === "product" && (
                <div className="bg-white rounded-lg shadow p-5 space-y-4">
                    <h2 className="text-lg font-semibold">Product Order</h2>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p>Order ID: #{booking?.id}</p>
                        <p>Status: {booking?.status}</p>
                        <p>Total Items: {booking?.items?.length}</p>
                        <p>Total Amount: ₹{booking?.total_amount}</p>
                    </div>

                    <div className="space-y-3">
                        {booking?.items?.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex gap-4 border rounded-lg p-3"
                            >
                                <img
                                    src={imgUrl(item?.image)}
                                    alt={item?.name}
                                    className="w-24 h-24 object-cover rounded"
                                />

                                <div className="flex-1">
                                    <p className="font-semibold">{item?.name}</p>
                                    <p>Qty: {item?.quantity}</p>
                                    <p>Price: ₹{item?.price}</p>
                                    <p>Status: {item?.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===================== ASTRO ===================== */}
            {type === "astro" && (
                <div className="bg-white rounded-lg shadow p-5 space-y-4">
                    <h2 className="text-lg font-semibold">Astrology Booking</h2>

                    <div className="flex gap-4">
                        <img
                            src={imgUrl(booking?.asker?.astro_snapshot?.image)}
                            alt={booking?.asker?.astro_snapshot?.name}
                            className="w-32 h-32 object-cover rounded"
                        />

                        <div>
                            <p className="font-semibold">
                                {booking?.asker?.astro_snapshot?.name}
                            </p>
                            <p>Type: {booking?.communication_type}</p>
                            <p>Duration: {booking?.duration_minutes} min</p>
                            <p>Status: {booking?.booking_status}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="border-t pt-4">
                            <h3 className="font-semibold">User Question</h3>
                            <p className="text-sm">
                                {booking?.asker?.user?.question}
                            </p>

                            <h3 className="font-semibold mt-3">User Details</h3>
                            <p>Name: {booking?.asker?.user?.name}</p>
                            <p>DOB: {booking?.asker?.user?.dob}</p>
                            <p>Place Of Birth: {booking?.asker?.user?.place_of_birth}</p>
                            <p>Time Of Birth: {booking?.asker?.user?.time_of_birth}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mt-3">Payments Details</h3>
                            <p>Amount: {booking?.amount}</p>
                            <p>OrderId: {booking?.gateway_order_id}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetails;
