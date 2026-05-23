import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { loadRazorpay } from "../../utils/loadRazorpay";

const VITE_URL = import.meta.env.VITE_BACKEND_FOR_URL;

export default function PujaCheckout() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [puja, setPuja] = useState(null);
    const [loading, setLoading] = useState(false);

    const [packageType, setPackageType] = useState("single");

    const peopleCount = useMemo(() => {
        if (packageType === "single") return 1;
        if (packageType === "couple") return 2;
        if (packageType === "family") return 4;
        if (packageType === "joint_family") return 6;
        return 1;
    }, [packageType]);

    const [whatsappNumber, setWhatsappNumber] = useState("");


    const [gotra, setGotra] = useState("");
    const [devotees, setDevotees] = useState([{ name: "" }]);


    const fixImageUrl = (imgPath) => {
        if (!imgPath) return "/no-image.png";
        if (imgPath.startsWith("http")) return imgPath;
        const cleanPath = imgPath.replaceAll("\\", "/");
        return `${VITE_URL}/${cleanPath}`;
    };

    // ✅ Fetch Puja by ID
    const fetchPujaById = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/puja/${id}`);
            const item = res?.data?.data?.[0];

            if (!item) {
                setPuja(null);
                return;
            }

            setPuja({
                ...item,
                image: fixImageUrl(item.image),
                price: Number(item.price || 0),
            });
        } catch (err) {
            console.log("Fetch puja error:", err);
            setPuja(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPujaById();
    }, [id]);

    // ✅ Reset devotees count when package changes
    useEffect(() => {
        setDevotees((prev) => {
            const next = [...prev];

            if (next.length < peopleCount) {
                for (let i = next.length; i < peopleCount; i++) {
                    next.push({ name: "" });
                }
            } else if (next.length > peopleCount) {
                next.length = peopleCount;
            }
            return next;
        });
    }, [peopleCount]);


    const subtotal = useMemo(() => {
        if (!puja) return 0;
        return puja.price * peopleCount;
    }, [puja, peopleCount]);

    const tax = Math.round(subtotal * 0.05);
    const platformFee = 10;
    const total = subtotal + tax + platformFee;

    // ✅ Pay Now

    const updateDevotee = (index, value) => {
        setDevotees((prev) =>
            prev.map((d, i) => (i === index ? { ...d, name: value } : d))
        );
    };


    const handlePayNow = async () => {
        try {
            if (!puja) return;

            if (!whatsappNumber || whatsappNumber.length < 10) {
                alert("Please enter valid WhatsApp number");
                return;
            }

            if (!gotra.trim()) {
                alert("Please enter Gotra");
                return;
            }

            for (let i = 0; i < devotees.length; i++) {
                if (!devotees[i].name.trim()) {
                    alert(`Please fill devotee ${i + 1} name`);
                    return;
                }
            }


            const devoteesPayload = devotees.map((d, idx) => ({
                person_no: idx + 1,
                name: d.name.trim(),
            }));

            const payload = {
                puja_id: puja.id,
                package_type: packageType,
                people_count: peopleCount,
                gotra: gotra.trim(),
                devotees: devoteesPayload,
                total_amount: total,
                whatsapp_number: whatsappNumber,
            };

            // ✅ Create Razorpay Order
            const orderRes = await api.post(
                "/puja-booking/razorpay/create-order",
                payload,
                { withCredentials: true }
            );

            if (!orderRes?.data?.success) {
                alert("Failed to create order");
                return;
            }

            const loaded = await loadRazorpay();
            if (!loaded) {
                alert("Razorpay SDK failed to load");
                return;
            }

            const { razorpayOrderId, amount, currency } = orderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount,
                currency,
                name: "PujaPath",
                description: "Puja Booking",
                order_id: razorpayOrderId,

                handler: async function (response) {
                    try {
                        const verifyRes = await api.post(
                            "/puja-booking/razorpay/verify",
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                ...payload,
                            },
                            { withCredentials: true }
                        );

                        if (verifyRes?.data?.success) {
                            alert("✅ Payment success & puja booked!");
                            navigate("/");
                        } else {
                            alert("❌ Payment verification failed");
                        }
                    } catch (err) {
                        console.log(err);
                        alert("❌ Verification failed");
                    }
                },

                theme: {
                    color: "#f97316",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.log("Pay Now Error:", error);
            alert(error?.response?.data?.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 text-center">
                <p className="text-gray-600">Loading Puja...</p>
            </div>
        );
    }

    if (!puja) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 text-center">
                <p className="text-gray-600">Puja not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ✅ LEFT: PUJA DETAILS */}
                <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
                    <div className="flex gap-4">
                        <img
                            src={puja.image}
                            alt={puja.name}
                            className="w-28 h-28 object-cover rounded-lg border"
                        />

                        <div>
                            <h2 className="text-lg font-bold text-gray-800">{puja.name}</h2>
                            <p className="text-sm text-gray-600 mt-1">{puja.description}</p>
                            <p className="mt-2 text-orange-600 font-bold">
                                ₹{puja.price} / person
                            </p>
                        </div>
                    </div>

                    {/* ✅ PACKAGE TYPE */}
                    <div className="mt-5">
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Select Package Type
                        </h3>

                        <select
                            value={packageType}
                            onChange={(e) => setPackageType(e.target.value)}
                            className="w-full border px-3 py-2 rounded-lg"
                        >
                            <option value="single">Single (1 Person)</option>
                            <option value="couple">Couple (2 People)</option>
                            <option value="family">Family (4 People)</option>
                            <option value="joint_family">Joint Family (6 People)</option>
                        </select>

                        <p className="text-sm text-gray-600 mt-2">
                            People Count: <b>{peopleCount}</b>
                        </p>
                    </div>

                    {/* ✅ WHATSAPP */}
                    <div className="mt-5">
                        <h3 className="font-semibold text-gray-800 mb-2">
                            WhatsApp Number
                        </h3>
                        <input
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="Enter WhatsApp number"
                            className="w-full border px-3 py-2 rounded-lg"
                        />
                    </div>

                    {/* ✅ DEVOTEES */}
                    <div className="mt-5">
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Devotee Details
                        </h3>

                        <div className="space-y-3">
                            {devotees.map((d, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                    <p className="text-sm font-medium mb-2">Person {index + 1}</p>

                                    <input
                                        value={d.name}
                                        onChange={(e) => updateDevotee(index, e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full border px-3 py-2 rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* ✅ GOTRA (ONLY ONCE) */}
                        <div className="mt-5">
                            <h3 className="font-semibold text-gray-800 mb-2">Gotra (Only One Time)</h3>
                            <input
                                value={gotra}
                                onChange={(e) => setGotra(e.target.value)}
                                placeholder="Enter Gotra"
                                className="w-full border px-3 py-2 rounded-lg"
                            />
                        </div>


                    </div>
                </div>

                {/* ✅ RIGHT: SUMMARY */}
                <div className="bg-white rounded-xl shadow p-4 h-fit">
                    <h3 className="text-lg font-bold text-gray-800">Summary</h3>

                    <div className="mt-3 text-sm text-gray-700 space-y-2">
                        <p>
                            Subtotal: <b>₹{subtotal}</b>
                        </p>
                        <p>
                            Tax (5%): <b>₹{tax}</b>
                        </p>
                        <p>
                            Platform Fee: <b>₹{platformFee}</b>
                        </p>

                        <hr />

                        <p className="text-base">
                            Total: <b className="text-orange-600">₹{total}</b>
                        </p>
                    </div>

                    <button
                        onClick={handlePayNow}
                        className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-medium"
                    >
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
}
