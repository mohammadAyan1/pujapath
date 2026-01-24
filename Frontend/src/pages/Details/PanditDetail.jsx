import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { getImageUrl } from "../../utils/getImageUrl";
import { useAuth } from "../../AuthContext/AuthContext";
import VoiceCallModal from "../../components/VoiceCallModal/VoiceCallModal";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

export default function PanditDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [pandit, setPandit] = useState(null);
    const [loading, setLoading] = useState(true);

    const [openCall, setOpenCall] = useState(false);

    const fetchPandit = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/pandit/${id}`);
            console.log(res?.data?.data);

            if (res?.data?.success) setPandit(res.data.data);
            else toast.error("Pandit not found");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Pandit load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPandit();
    }, [id]);

    if (loading) return <div className="p-6">Loading pandit...</div>;
    if (!pandit) return <div className="p-6">No pandit found</div>;

    // ✅ IMPORTANT:
    // you must return pandit.user_id from backend
    const receiverUserId = pandit.user_id;
    // const receiverUserId = 17;


    console.log(receiverUserId);


    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="text-sm text-orange-600 font-semibold mb-4"
            >
                ← Back
            </button>

            <div className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row gap-5">
                <img
                    src={getImageUrl(pandit.image, BASE_URL_IMAGE)}
                    alt={pandit.name}
                    className="w-full md:w-[260px] h-[260px] rounded-2xl object-cover border"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/no-image.png";
                    }}
                />

                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{pandit.name}</h1>

                    <p className="text-sm text-gray-600 mt-1">
                        Expertise: <span className="font-semibold">{pandit.expertise}</span>
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                        Experience: <span className="font-semibold">{pandit.experience} yrs</span>
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                        Language: <span className="font-semibold">{pandit.language}</span>
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                        Rating: <span className="font-semibold">{pandit.rating || "4.5"}</span>
                    </p>

                    <p className="text-sm text-gray-700 mt-4">{pandit.about}</p>

                    <div className="mt-4 flex items-center gap-3">
                        <span
                            className={`text-xs px-3 py-1 rounded-full ${pandit.is_available === 1
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {pandit.is_available === 1 ? "Available" : "Busy"}
                        </span>

                        <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                            {pandit.type === "astro" ? "Astrologer" : "Pandit"}
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        {/* ✅ Your existing checkout button */}
                        <button
                            onClick={() => navigate(`/astro-checkout/${pandit.id}`)}
                            className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-semibold"
                        >
                            {pandit.is_free === 1
                                ? "Start Free Consultation"
                                : `Consult @ ₹${pandit.price_per_minute}/min`}
                        </button>

                        {/* ✅ NEW VOICE CALL BUTTON */}
                        <button
                            onClick={() => {
                                if (!user?.id) {
                                    toast.error("Please login first");
                                    return;
                                }

                                if (!receiverUserId) {
                                    toast.error("Pandit user id not found (user_id missing)");
                                    return;
                                }

                                setOpenCall(true);
                            }}
                            className="px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-semibold"
                        >
                            📞 Voice Call
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Voice Call Modal */}
            <VoiceCallModal
                isOpen={openCall}
                onClose={() => setOpenCall(false)}
                myUserId={user?.id}
                receiverUserId={receiverUserId}
                receiverName={pandit.name}
            />
        </div>
    );
}
