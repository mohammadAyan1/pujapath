// import React, { useEffect, useMemo, useState } from "react";
// import api from "../../api/axios";
// import { toast } from "react-toastify";
// import { useParams, useNavigate } from "react-router-dom";

// const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

// const AstroCheckout = () => {
//     const { id } = useParams(); // astro_id
//     const navigate = useNavigate();

//     const [astro, setAstro] = useState(null);
//     const [loading, setLoading] = useState(false);

//     const [communicationType, setCommunicationType] = useState("");
//     const [minutes, setMinutes] = useState(5);

//     // ✅ asker's info (store in astro_booking.asker JSON)
//     const [asker, setAsker] = useState({
//         name: "",
//         dob: "",
//         time_of_birth: "",
//         place_of_birth: "",
//         question: "",
//     });

//     const getImageUrl = (imgPath) => {
//         if (!imgPath) return "/no-image.png";
//         if (imgPath.startsWith("http")) return imgPath;
//         return `${BASE_URL_IMAGE}/${imgPath}`;
//     };

//     const parseCommunication = (comm) => {
//         try {
//             if (!comm) return [];
//             if (Array.isArray(comm)) return comm;
//             if (typeof comm === "string") return JSON.parse(comm);
//             return [];
//         } catch {
//             return [];
//         }
//     };

//     const commOptions = useMemo(() => {
//         if (!astro) return [];
//         return parseCommunication(astro.communication);
//     }, [astro]);

//     const fetchAstroDetails = async () => {
//         try {
//             setLoading(true);
//             const res = await api.get(`/pandit?status=active&page=1&limit=1`);

//             // ❌ This is just fallback if you don’t have getById API
//             // ✅ BETTER: create a new API: GET /pandit/:id
//             // For now, you should create getById API.

//             toast.error("Please create GET /pandit/:id API for astro details.");
//         } catch (err) {
//             toast.error("Failed to load astro");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ Recommended: Create GET /pandit/:id
//     const fetchAstroById = async () => {
//         try {
//             setLoading(true);
//             const res = await api.get(`/pandit/${id}`);
//             if (res?.data?.success) {
//                 setAstro(res.data.data);

//                 const comm = parseCommunication(res.data.data.communication);
//                 const defaultComm = comm.find((x) => x !== "offline") || comm[0] || "";
//                 setCommunicationType(defaultComm);
//             } else {
//                 toast.error("Astro not found");
//             }
//         } catch (err) {
//             toast.error(err?.response?.data?.message || "Astro not found");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchAstroById();
//     }, [id]);

//     const totalAmount = useMemo(() => {
//         if (!astro) return 0;
//         if (Number(astro.is_free) === 1) return 0;

//         const rate = Number(astro.price_per_minute || 0);
//         const mins = Number(minutes || 0);
//         if (!rate || mins < 5) return 0;

//         return rate * mins;
//     }, [astro, minutes]);

//     const loadRazorpayScript = () => {
//         return new Promise((resolve) => {
//             if (document.getElementById("razorpay-sdk")) return resolve(true);

//             const script = document.createElement("script");
//             script.id = "razorpay-sdk";
//             script.src = "https://checkout.razorpay.com/v1/checkout.js";
//             script.onload = () => resolve(true);
//             script.onerror = () => resolve(false);
//             document.body.appendChild(script);
//         });
//     };

//     const handlePayAndBook = async () => {
//         if (!astro) return;

//         if (!communicationType) {
//             toast.error("Please select communication type");
//             return;
//         }

//         if (communicationType === "offline") {
//             toast.error("Offline booking is not allowed");
//             return;
//         }

//         const mins = Number(minutes);
//         if (!mins || mins < 5) {
//             toast.error("Minimum duration is 5 minutes");
//             return;
//         }

//         const sdkLoaded = await loadRazorpayScript();
//         if (!sdkLoaded) {
//             toast.error("Razorpay SDK failed to load");
//             return;
//         }

//         try {
//             setLoading(true);

//             // ✅ 1) Create order on backend
//             const orderRes = await api.post("/astro-booking/razorpay/create-order", {
//                 astro_id: astro.id,
//                 communication_type: communicationType,
//                 duration_minutes: mins,
//                 asker,
//             });

//             if (!orderRes?.data?.success) {
//                 toast.error(orderRes?.data?.message || "Failed to create order");
//                 return;
//             }

//             const { razorpayOrderId, amount } = orderRes.data.data;

//             // ✅ FREE booking (no payment)
//             if (!razorpayOrderId || Number(amount) === 0) {
//                 const verifyRes = await api.post("/astro-booking/razorpay/verify", {
//                     astro_id: astro.id,
//                     communication_type: communicationType,
//                     duration_minutes: mins,
//                     asker,
//                     total_amount: 0,

//                     razorpay_order_id: null,
//                     razorpay_payment_id: null,
//                     razorpay_signature: null,
//                 });

//                 if (verifyRes?.data?.success) {
//                     toast.success("Booked successfully ✅");
//                     navigate("/my-bookings");
//                 } else {
//                     toast.error(verifyRes?.data?.message || "Booking failed");
//                 }
//                 return;
//             }

//             // ✅ 2) Paid booking -> open Razorpay popup
//             const options = {
//                 key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//                 amount: Math.round(Number(amount) * 100),
//                 currency: "INR",
//                 name: "Astro Booking",
//                 description: `Booking for ${mins} minutes`,
//                 order_id: razorpayOrderId,

//                 handler: async function (response) {
//                     try {
//                         const verifyRes = await api.post("/astro-booking/razorpay/verify", {
//                             astro_id: astro.id,
//                             communication_type: communicationType,
//                             duration_minutes: mins,
//                             asker,
//                             total_amount: amount,

//                             razorpay_order_id: response.razorpay_order_id,
//                             razorpay_payment_id: response.razorpay_payment_id,
//                             razorpay_signature: response.razorpay_signature,
//                         });

//                         if (verifyRes?.data?.success) {
//                             toast.success("Booking confirmed ✅");
//                             navigate("/my-bookings");
//                         } else {
//                             toast.error(verifyRes?.data?.message || "Booking failed");
//                         }
//                     } catch (err) {
//                         toast.error(err?.response?.data?.message || "Booking verification failed");
//                     }
//                 },

//                 theme: {
//                     color: "#F97316",
//                 },
//             };

//             const rz = new window.Razorpay(options);
//             rz.open();
//         } catch (err) {
//             toast.error(err?.response?.data?.message || "Payment failed");
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (loading && !astro) {
//         return (
//             <div className="min-h-[60vh] flex items-center justify-center">
//                 Loading...
//             </div>
//         );
//     }

//     if (!astro) {
//         return (
//             <div className="min-h-[60vh] flex items-center justify-center">
//                 Astro not found
//             </div>
//         );
//     }

//     {/* .filter((x) => x !== "offline") */ }

//     return (
//         <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8">
//             <div className="max-w-4xl mx-auto px-4">
//                 <div className="bg-white rounded-xl shadow p-5 grid md:grid-cols-2 gap-6">
//                     {/* Left */}
//                     <div>
//                         <img
//                             src={getImageUrl(astro.image)}
//                             alt={astro.name}
//                             className="w-full h-64 object-cover rounded-lg"
//                             onError={(e) => (e.target.src = "/no-image.png")}
//                         />

//                         <h2 className="text-xl font-bold mt-4">{astro.name}</h2>
//                         <p className="text-sm text-gray-600 mt-1">
//                             {astro.type?.toUpperCase()} • {astro.expertise}
//                         </p>

//                         <div className="mt-3">
//                             {astro.is_free == 1 ? (
//                                 <p className="text-green-600 font-semibold">✅ FREE</p>
//                             ) : (
//                                 <p className="text-orange-600 font-semibold">
//                                     ₹{astro.price_per_minute}/min
//                                 </p>
//                             )}
//                         </div>

//                         <div className="mt-4">
//                             <p className="text-xs text-gray-500 font-semibold mb-1">
//                                 Available Communication:
//                             </p>

//                             <div className="flex flex-wrap gap-2">
//                                 {commOptions.map((x) => (
//                                     <span
//                                         key={x}
//                                         className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
//                                     >
//                                         {x.toUpperCase()}
//                                     </span>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right */}
//                     <div>
//                         <h3 className="text-lg font-bold mb-3">Book Communication</h3>

//                         {/* Communication Type */}
//                         <label className="text-sm font-semibold text-gray-700">
//                             Communication Type
//                         </label>
//                         <select
//                             value={communicationType}
//                             onChange={(e) => setCommunicationType(e.target.value)}
//                             className="w-full mt-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
//                         >
//                             <option value="">Select option</option>
//                             {commOptions
//                                 .map((x) => (
//                                     <option key={x} value={x}>
//                                         {x.toUpperCase()}
//                                     </option>
//                                 ))}
//                         </select>

//                         {/* Minutes */}
//                         <label className="text-sm font-semibold text-gray-700 mt-4 block">
//                             Duration (Minutes) (min 5)
//                         </label>
//                         <input
//                             type="number"
//                             min={5}
//                             value={minutes}
//                             onChange={(e) => setMinutes(e.target.value)}
//                             className="w-full mt-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
//                         />

//                         {/* Ask Details */}
//                         <div className="mt-4 space-y-3">
//                             <input
//                                 className="w-full border rounded-lg px-3 py-2"
//                                 placeholder="Your Name"
//                                 value={asker.name}
//                                 onChange={(e) => setAsker({ ...asker, name: e.target.value })}
//                             />

//                             <input
//                                 className="w-full border rounded-lg px-3 py-2"
//                                 placeholder="DOB (optional)"
//                                 value={asker.dob}
//                                 onChange={(e) => setAsker({ ...asker, dob: e.target.value })}
//                             />

//                             <textarea
//                                 className="w-full border rounded-lg px-3 py-2"
//                                 placeholder="Your question..."
//                                 rows={3}
//                                 value={asker.question}
//                                 onChange={(e) =>
//                                     setAsker({ ...asker, question: e.target.value })
//                                 }
//                             />
//                         </div>

//                         {/* Total Amount */}
//                         <div className="mt-4 flex justify-between items-center border-t pt-3">
//                             <span className="text-sm font-semibold text-gray-700">
//                                 Total Amount:
//                             </span>
//                             <span className="text-lg font-bold text-orange-600">
//                                 ₹{Number(totalAmount).toFixed(2)}
//                             </span>
//                         </div>

//                         <button
//                             onClick={handlePayAndBook}
//                             disabled={loading}
//                             className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-semibold disabled:bg-gray-300"
//                         >
//                             {loading ? "Processing..." : "Pay & Book"}
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AstroCheckout;



import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaPhoneAlt,
    FaComments,
    FaUserSlash,
    FaStar,
    FaLanguage,
    FaClock,
    FaUserTie,
} from "react-icons/fa";
import { GiAstronautHelmet } from "react-icons/gi";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

const AstroCheckout = () => {
    const { id } = useParams(); // pandit/astro id
    const navigate = useNavigate();

    const [astro, setAstro] = useState(null);
    const [loading, setLoading] = useState(false);

    const [communicationType, setCommunicationType] = useState("");
    const [minutes, setMinutes] = useState(5);

    const [asker, setAsker] = useState({
        name: "",
        dob: "",
        time_of_birth: "",
        place_of_birth: "",
        question: "",
        phone: "",
    });

    const getImageUrl = (imgPath) => {
        if (!imgPath) return "/no-image.png";
        if (imgPath.startsWith("http")) return imgPath;
        return `${BASE_URL_IMAGE}/${imgPath}`;
    };

    const safeParseArray = (val) => {
        try {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === "string") {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch {
            // if old string path
            if (typeof val === "string" && val.includes("uploads")) return [val];
            return [];
        }
    };

    const commOptions = useMemo(() => {
        if (!astro) return [];
        return safeParseArray(astro.communication);
    }, [astro]);

    const expertiseList = useMemo(() => {
        if (!astro) return [];
        const list = safeParseArray(astro.expertise_list);
        if (list.length > 0) return list;
        if (astro.expertise) return [astro.expertise];
        return [];
    }, [astro]);

    const galleryImages = useMemo(() => {
        if (!astro) return [];
        return safeParseArray(astro.images);
    }, [astro]);

    const fetchAstroById = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/pandit/${id}`);
            if (res?.data?.success) {
                const data = res.data.data;
                setAstro(data);

                // ✅ default communication = first non-offline if exists
                const comm = safeParseArray(data.communication);
                const defaultComm = comm.find((x) => x !== "offline") || comm[0] || "";
                setCommunicationType(defaultComm);
            } else {
                toast.error("Pandit/Astro not found");
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Pandit/Astro not found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAstroById();
    }, [id]);

    const totalAmount = useMemo(() => {
        if (!astro) return 0;
        if (Number(astro.is_free) === 1) return 0;

        const rate = Number(astro.price_per_minute || 0);
        const mins = Number(minutes || 0);

        if (!rate || mins < 5) return 0;
        return rate * mins;
    }, [astro, minutes]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (document.getElementById("razorpay-sdk")) return resolve(true);

            const script = document.createElement("script");
            script.id = "razorpay-sdk";
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayAndBook = async () => {
        if (!astro) return;

        if (!communicationType) {
            toast.error("Please select communication type");
            return;
        }

        if (communicationType === "offline") {
            toast.error("Offline booking is not allowed");
            return;
        }

        const mins = Number(minutes);
        if (!mins || mins < 5) {
            toast.error("Minimum duration is 5 minutes");
            return;
        }

        if (!asker.name.trim()) {
            toast.error("Please enter your name");
            return;
        }

        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) {
            toast.error("Razorpay SDK failed to load");
            return;
        }

        try {
            setLoading(true);

            // ✅ 1) Create order on backend
            const orderRes = await api.post("/astro-booking/razorpay/create-order", {
                astro_id: astro.id,
                communication_type: communicationType,
                duration_minutes: mins,
                asker,
            });

            if (!orderRes?.data?.success) {
                toast.error(orderRes?.data?.message || "Failed to create order");
                return;
            }

            const { razorpayOrderId, amount } = orderRes.data.data;

            // ✅ FREE booking flow
            if (!razorpayOrderId || Number(amount) === 0) {
                const verifyRes = await api.post("/astro-booking/razorpay/verify", {
                    astro_id: astro.id,
                    communication_type: communicationType,
                    duration_minutes: mins,
                    asker,
                    total_amount: 0,

                    razorpay_order_id: null,
                    razorpay_payment_id: null,
                    razorpay_signature: null,
                });

                if (verifyRes?.data?.success) {
                    toast.success("Booked successfully ✅");
                    navigate("/my-bookings");
                } else {
                    toast.error(verifyRes?.data?.message || "Booking failed");
                }
                return;
            }

            // ✅ 2) Paid booking
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: Math.round(Number(amount) * 100),
                currency: "INR",
                name: "Pandit/Astro Booking",
                description: `Booking for ${mins} minutes`,
                order_id: razorpayOrderId,

                handler: async function (response) {
                    try {
                        const verifyRes = await api.post("/astro-booking/razorpay/verify", {
                            astro_id: astro.id,
                            communication_type: communicationType,
                            duration_minutes: mins,
                            asker,
                            total_amount: amount,

                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes?.data?.success) {
                            toast.success("Booking confirmed ✅");
                            navigate("/my-bookings");
                        } else {
                            toast.error(verifyRes?.data?.message || "Booking failed");
                        }
                    } catch (err) {
                        toast.error(
                            err?.response?.data?.message || "Booking verification failed"
                        );
                    }
                },

                theme: {
                    color: "#F97316",
                },
            };

            const rz = new window.Razorpay(options);
            rz.open();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !astro) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!astro) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                Pandit/Astro not found
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow p-5 grid md:grid-cols-2 gap-6">
                    {/* ✅ LEFT: Astro Details */}
                    <div>
                        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                                src={getImageUrl(astro.image)}
                                alt={astro.name}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.target.src = "/no-image.png")}
                            />
                        </div>

                        {/* ✅ Name + Type */}
                        <div className="mt-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold">{astro.name}</h2>
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                    {astro.type === "astro" ? (
                                        <GiAstronautHelmet className="text-purple-600" />
                                    ) : (
                                        <FaUserTie className="text-orange-600" />
                                    )}
                                    {astro.type?.toUpperCase()}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-green-600 flex items-center gap-1 justify-end">
                                    <FaStar /> {Number(astro.rating || 0).toFixed(1)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {astro.experience || 0} yrs exp
                                </p>
                            </div>
                        </div>

                        {/* ✅ Pricing */}
                        <div className="mt-3">
                            {astro.is_free == 1 ? (
                                <p className="text-green-600 font-semibold">✅ FREE</p>
                            ) : (
                                <p className="text-orange-600 font-semibold">
                                    ₹{astro.price_per_minute}/min
                                </p>
                            )}
                        </div>

                        {/* ✅ About */}
                        {astro.about && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-700">About</p>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    {astro.about}
                                </p>
                            </div>
                        )}

                        {/* ✅ Expertise List */}
                        {expertiseList.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-700">Expertise</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {expertiseList.map((ex, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold"
                                        >
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ✅ Languages */}
                        {astro.language && (
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaLanguage /> Languages
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{astro.language}</p>
                            </div>
                        )}

                        {/* ✅ Communication Options */}
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700">
                                Available Communication
                            </p>

                            {commOptions.length === 0 ? (
                                <p className="text-xs text-gray-400 mt-1">Not available</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {commOptions.includes("call") && (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            <FaPhoneAlt size={12} /> CALL
                                        </span>
                                    )}

                                    {commOptions.includes("chat") && (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                            <FaComments size={12} /> CHAT
                                        </span>
                                    )}

                                    {commOptions.includes("offline") && (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                            <FaUserSlash size={12} /> OFFLINE
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ✅ Gallery */}
                        {galleryImages.length > 0 && (
                            <div className="mt-5">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                    Gallery
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {galleryImages.slice(0, 6).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="h-20 rounded-lg overflow-hidden bg-gray-100"
                                        >
                                            <img
                                                src={getImageUrl(img)}
                                                alt="gallery"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target.src = "/no-image.png")}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ RIGHT: Booking Form */}
                    <div>
                        <h3 className="text-lg font-bold mb-3">Book Communication</h3>

                        {/* Communication Type */}
                        <label className="text-sm font-semibold text-gray-700">
                            Communication Type
                        </label>
                        <select
                            value={communicationType}
                            onChange={(e) => setCommunicationType(e.target.value)}
                            className="w-full mt-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Select option</option>

                            {/* ✅ FILTER OUT OFFLINE FOR BOOKING */}
                            {commOptions
                                .filter((x) => x !== "offline")
                                .map((x) => (
                                    <option key={x} value={x}>
                                        {x.toUpperCase()}
                                    </option>
                                ))}
                        </select>

                        {/* Minutes */}
                        <label className="text-sm font-semibold text-gray-700 mt-4 block">
                            Duration (Minutes) (min 5)
                        </label>
                        <div className="relative">
                            <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                min={5}
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                                className="w-full mt-1 border rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {/* Ask Details */}
                        <div className="mt-4 space-y-3">
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Your Name *"
                                value={asker.name}
                                onChange={(e) => setAsker({ ...asker, name: e.target.value })}
                            />

                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Phone (optional)"
                                value={asker.phone}
                                onChange={(e) => setAsker({ ...asker, phone: e.target.value })}
                            />

                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="DOB"
                                value={asker.dob}
                                onChange={(e) => setAsker({ ...asker, dob: e.target.value })}
                            />

                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Time of Birth (optional)"
                                value={asker.time_of_birth}
                                onChange={(e) =>
                                    setAsker({ ...asker, time_of_birth: e.target.value })
                                }
                            />

                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Place of Birth (optional)"
                                value={asker.place_of_birth}
                                onChange={(e) =>
                                    setAsker({ ...asker, place_of_birth: e.target.value })
                                }
                            />

                            <textarea
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Your question... (optional)"
                                rows={3}
                                value={asker.question}
                                onChange={(e) =>
                                    setAsker({ ...asker, question: e.target.value })
                                }
                            />
                        </div>

                        {/* Total */}
                        <div className="mt-4 flex justify-between items-center border-t pt-3">
                            <span className="text-sm font-semibold text-gray-700">
                                Total Amount:
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                                ₹{Number(totalAmount).toFixed(2)}
                            </span>
                        </div>

                        <button
                            onClick={handlePayAndBook}
                            disabled={loading}
                            className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-semibold disabled:bg-gray-300"
                        >
                            {loading ? "Processing..." : "Pay & Book"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AstroCheckout;
