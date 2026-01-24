import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { getImageUrl } from "../../utils/getImageUrl";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

export default function TempleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [temple, setTemple] = useState(null);
    const [pujas, setPujas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTempleAndPujas = async () => {
        try {
            setLoading(true);

            // ✅ 2 API calls
            const [templeRes, pujaRes] = await Promise.all([
                api.get(`/temple/${id}`),
                api.get(`/puja?temple_id=${id}`), // ✅ backend should support this filter
            ]);

            if (templeRes?.data?.success) setTemple(templeRes.data.data);
            else toast.error("Temple not found");

            if (pujaRes?.data?.success) setPujas(pujaRes.data.data || []);
            else setPujas([]);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Temple load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTempleAndPujas();
    }, [id]);

    if (loading) return <div className="p-6">Loading temple...</div>;
    if (!temple) return <div className="p-6">No temple found</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="text-sm text-orange-600 font-semibold mb-4"
            >
                ← Back
            </button>

            {/* ✅ Temple Info */}
            <div className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row gap-5">
                <img
                    src={getImageUrl(temple.image, BASE_URL_IMAGE)}
                    alt={temple.name}
                    className="w-full md:w-[320px] h-[280px] rounded-2xl object-cover border"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/no-image.png";
                    }}
                />

                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{temple.name}</h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Location:{" "}
                        <span className="font-semibold">
                            {temple.area}, {temple.city}, {temple.state}
                        </span>
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                        Timing:{" "}
                        <span className="font-semibold">
                            {temple.opening_time} - {temple.closing_time}
                        </span>
                    </p>

                    <p className="mt-4 text-gray-700">{temple.description}</p>

                    {temple.has_live === 1 && temple.live_url && (
                        <a
                            href={temple.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-4 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition"
                        >
                            Watch Live Darshan →
                        </a>
                    )}
                </div>
            </div>

            {/* ✅ Temple Puja List */}
            <div className="mt-10">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Pujas in this Temple
                </h2>

                {pujas.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-6 text-gray-600">
                        No pujas available in this temple.
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {pujas.map((puja) => (
                            <div
                                key={puja.id}
                                onClick={() => navigate(`/puja/${puja.id}`)}
                                className="bg-white rounded-2xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                            >
                                <div className="h-36 bg-gray-100">
                                    <img
                                        src={getImageUrl(puja.image, BASE_URL_IMAGE)}
                                        alt={puja.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/no-image.png";
                                        }}
                                    />
                                </div>

                                <div className="p-4">
                                    <p className="font-semibold text-gray-900 line-clamp-2">
                                        {puja.name}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Duration: {puja.duration} mins
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 mt-2">
                                        ₹ {puja.price}
                                    </p>

                                    <button className="mt-3 w-full py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition">
                                        Book Puja
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
