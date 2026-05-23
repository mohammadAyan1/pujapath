import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { loadRazorpay } from "../../utils/loadRazorpay";

export default function CheckoutModal({ cartItems, onClose, onSuccess }) {
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [loading, setLoading] = useState(false);

    const [newAddress, setNewAddress] = useState({
        full_name: "",
        phone_number: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    /* ---------------- FETCH ADDRESS ---------------- */
    const fetchAddresses = async () => {
        const res = await api.get("/address", { withCredentials: true });
        const list = res?.data?.data || [];
        setAddresses(list);
        if (list.length && !selectedAddressId) {
            setSelectedAddressId(list[list.length - 1].id);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const selectedAddress = useMemo(
        () => addresses.find((a) => a.id === selectedAddressId),
        [addresses, selectedAddressId]
    );

    /* ---------------- CALCULATIONS ---------------- */

    console.log(cartItems);

    const subtotal = cartItems.reduce(
        (sum, i) => sum + Number(i.total_price),
        0
    );

    console.log(subtotal)



    const shipping = subtotal > 1000 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05);
    const platformFee = 10;
    const total = subtotal + shipping + tax + platformFee;

    /* ---------------- ADD ADDRESS ---------------- */
    const saveAddress = async () => {
        await api.post("/address", newAddress, { withCredentials: true });
        await fetchAddresses();
        setShowAdd(false);
    };

    /* ---------------- PLACE ORDER ---------------- */
    const placeOrder = async () => {
        if (!selectedAddress) return alert("Select address");
        setLoading(true);

        const payload = {
            items: cartItems.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
            })),
            total_item_price: subtotal,
            address_id: selectedAddress.id,
            shipping_price: shipping,
            platform_price: platformFee,
            tax,
            total_value: total,
        };

        try {
            // COD
            if (paymentMethod === "COD") {
                await api.post("/cart-booking/cod", payload, {
                    withCredentials: true,
                });
                alert("✅ Order placed (COD)");
                onSuccess();
                return;
            }

            // ONLINE
            const orderRes = await api.post(
                "/cart-booking/razorpay/create-order",
                payload,
                { withCredentials: true }
            );

            const loaded = await loadRazorpay();
            if (!loaded) throw new Error("Razorpay SDK failed");

            const { razorpayOrderId, amount } = orderRes.data.data;

            const rzp = new window.Razorpay({
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount,
                currency: "INR",
                order_id: razorpayOrderId,
                name: "PujaPath Store",
                handler: async (response) => {
                    await api.post(
                        "/cart-booking/razorpay/verify",
                        {
                            ...response,
                            ...payload,
                        },
                        { withCredentials: true }
                    );
                    alert("✅ Payment Success");
                    onSuccess();
                },
            });

            rzp.open();
        } catch (err) {
            alert("❌ Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- UI ---------------- */
    return (
        <div className="modal">
            <h3>Checkout</h3>

            {/* Address */}
            <h4>Shipping Address</h4>
            {addresses.length === 0 && <p>No address found</p>}
            {addresses.map((a) => (
                <label key={a.id}>
                    <input
                        type="radio"
                        checked={selectedAddressId === a.id}
                        onChange={() => setSelectedAddressId(a.id)}
                    />
                    {a.full_name} – {a.city}
                </label>
            ))}

            <button onClick={() => setShowAdd(true)}>+ Add Address</button>

            {showAdd && (
                <>
                    <input
                        placeholder="Full Name"
                        onChange={(e) =>
                            setNewAddress({ ...newAddress, full_name: e.target.value })
                        }
                    />
                    <input
                        placeholder="Phone"
                        onChange={(e) =>
                            setNewAddress({ ...newAddress, phone_number: e.target.value })
                        }
                    />
                    <textarea
                        placeholder="Address"
                        onChange={(e) =>
                            setNewAddress({ ...newAddress, address: e.target.value })
                        }
                    />
                    <button onClick={saveAddress}>Save</button>
                </>
            )}

            {/* Payment */}
            <h4>Payment Method</h4>
            <label>
                <input
                    type="radio"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                />
                COD
            </label>
            <label>
                <input
                    type="radio"
                    checked={paymentMethod === "ONLINE"}
                    onChange={() => setPaymentMethod("ONLINE")}
                />
                Online
            </label>

            <h3>Total: ₹ {total}</h3>

            <button onClick={placeOrder} disabled={loading}>
                {loading ? "Processing..." : "Confirm Order"}
            </button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}
