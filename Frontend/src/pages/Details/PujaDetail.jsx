import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { getImageUrl } from "../../utils/getImageUrl";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

export default function PujaDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [puja, setPuja] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPuja = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/puja/${id}`);
            if (res?.data?.success) setPuja(res.data.data);
            else toast.error("Puja not found");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Puja load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPuja();
    }, [id]);

    if (loading) return <div className="p-6">Loading puja...</div>;
    if (!puja) return <div className="p-6">No puja found</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="text-sm text-orange-600 font-semibold mb-4"
            >
                ← Back
            </button>

            {puja?.map((item, index) => (



                <div className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row gap-5">
                    <img
                        src={getImageUrl(item.image, BASE_URL_IMAGE)}
                        alt={item.name}
                        className="w-full md:w-[300px] h-[280px] rounded-2xl object-cover border"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/no-image.png";
                        }}
                    />

                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>

                        <p className="mt-2 text-xl font-bold text-gray-900">₹ {item.price}</p>

                        <p className="mt-2 text-sm text-gray-600">
                            Duration: <span className="font-semibold">{item.duration} mins</span>
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                            Slots: <span className="font-semibold">{item.slot}</span>
                        </p>

                        {item.puja_date && (
                            <p className="mt-2 text-sm text-gray-600">
                                Date: <span className="font-semibold">{item.puja_date}</span>
                            </p>
                        )}

                        {item.start_time && (
                            <p className="mt-2 text-sm text-gray-600">
                                Time: <span className="font-semibold">{item.start_time}</span>
                            </p>
                        )}

                        <p className="mt-4 text-gray-700">{item.description}</p>

                        <div className="mt-5" onClick={() => navigate(`/puja-checkout/${item?.id}`)}>
                            <button className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-semibold">
                                Book Puja Now
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
