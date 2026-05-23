import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { useNavigate } from "react-router-dom";


export default function Checkout() {

    const VITE_URL = import.meta.env.VITE_BACKEND_FOR_URL
    const param = useParams();
    const navigate = useNavigate()

    const [cartItems, setCartItems] = useState([]);
    const [loadingProduct, setLoadingProduct] = useState(false);

    // ✅ ADDRESS STATES
    const [addresses, setAddresses] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(false);

    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // ✅ Add Address Form
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);

    const [newAddress, setNewAddress] = useState({
        full_name: "",
        phone_number: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    // ✅ Payment
    const [paymentMethod, setPaymentMethod] = useState("COD");

    // ✅ Fix product image path
    const fixImageUrl = (imgPath) => {
        if (!imgPath) return "https://via.placeholder.com/100";
        if (imgPath.startsWith("http")) return imgPath;
        const cleanPath = imgPath.replaceAll("\\", "/");
        return `${VITE_URL}/${cleanPath}`;
    };

    // ✅ Fetch Product by ID
    const fetchProductDetaildsById = async (id) => {
        try {
            setLoadingProduct(true);
            const res = await api.get(`/product/${id}`);

            const product = res?.data?.data?.[0];
            if (!product) {
                setCartItems([]);
                return;
            }

            const fixedItem = {
                id: product.id,
                name: product.name,
                price: Number(product.price || 0),
                qty: 1,
                image: fixImageUrl(product.image),
                stock: product.stock,
                description: product.description,
            };

            setCartItems([fixedItem]);
        } catch (error) {
            console.error("Fetch product error:", error);
            setCartItems([]);
        } finally {
            setLoadingProduct(false);
        }
    };

    useEffect(() => {
        if (param?.id) fetchProductDetaildsById(param.id);
    }, [param?.id]);

    // ✅ FETCH USER ADDRESSES
    const fetchAddresses = async () => {
        try {
            setLoadingAddress(true);
            const res = await api.get("/address", { withCredentials: true });

            const list = res?.data?.data || [];
            setAddresses(list);

            // ✅ Auto select latest address if nothing selected
            if (list.length > 0 && !selectedAddressId) {
                const latest = list[list.length - 1]; // latest address
                setSelectedAddressId(latest.id);
            }
        } catch (error) {
            console.error("Fetch address error:", error);
            setAddresses([]);
        } finally {
            setLoadingAddress(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    // ✅ When addresses update and selected is missing -> select latest again
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            setSelectedAddressId(addresses[addresses.length - 1].id);
        }
    }, [addresses, selectedAddressId]);

    // ✅ Selected Address Object
    const selectedAddress = useMemo(() => {
        return addresses.find((a) => a.id === selectedAddressId) || null;
    }, [addresses, selectedAddressId]);

    // ✅ Update Qty
    const updateQty = (id, type) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const newQty = type === "inc" ? item.qty + 1 : item.qty - 1;
                    return { ...item, qty: newQty < 1 ? 1 : newQty };
                }
                return item;
            })
        );
    };

    // ✅ Remove Item
    const removeItem = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    // ✅ Calculations
    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [cartItems]);

    const shipping = subtotal > 1000 ? 0 : cartItems.length > 0 ? 50 : 0;
    const tax = Math.round(subtotal * 0.05);
    const platformFee = 10
    const total = subtotal + shipping + tax + platformFee;

    // ✅ CREATE ADDRESS
    const handleCreateAddress = async () => {
        try {
            const { full_name, phone_number, address, city, state, pincode } =
                newAddress;

            if (!full_name || !phone_number || !address || !city || !state || !pincode) {
                alert("Please fill all address fields!");
                return;
            }

            setSavingAddress(true);

            await api.post("/address", newAddress, {
                withCredentials: true,
            });

            // ✅ After save, fetch again
            await fetchAddresses();

            // ✅ Auto select latest/new address
            setTimeout(() => {
                setSelectedAddressId((prev) => {
                    // choose latest from updated addresses
                    const latest = addresses[addresses.length - 1];
                    return latest?.id || prev;
                });
            }, 200);

            setShowAddAddressForm(false);

            setNewAddress({
                full_name: "",
                phone_number: "",
                address: "",
                city: "",
                state: "",
                pincode: "",
            });

            alert("✅ Address Added Successfully!");
        } catch (error) {
            console.error("Create address error:", error);
            alert(error?.response?.data?.message);
        } finally {
            setSavingAddress(false);
        }
    };

    // ✅ Place Order
    const handlePlaceOrder = async () => {
        try {
            if (cartItems.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            if (!selectedAddress) {
                alert("Please select a shipping address!");
                return;
            }

            const product = cartItems[0];

            // ✅ Final Charges
            const payloadCharges = {
                shipping_price: shipping,
                platform_price: platformFee,
                tax: tax,
                total_value: total,
            };

            // ✅ COD FLOW
            if (paymentMethod === "COD") {
                const codRes = await api.post(
                    "/product-booking/cod",
                    {
                        product_id: product.id,
                        quantity: product.qty,
                        address_id: selectedAddress.id,
                        ...payloadCharges,
                    },
                    { withCredentials: true }
                );

                if (codRes.data.success) {
                    alert("✅ Order placed with Cash On Delivery!");
                    console.log("COD Booking:", codRes.data.data);
                    navigate("/")



                } else {
                    alert("❌ COD booking failed");
                }

                return;
            }

            // ✅ ONLINE FLOW (Razorpay)
            const orderRes = await api.post(
                "/product-booking/razorpay/create-order",
                {
                    product_id: product.id,
                    quantity: product.qty,
                    address_id: selectedAddress.id,
                    ...payloadCharges,
                },
                { withCredentials: true }
            );

            if (!orderRes.data.success) {
                alert("Failed to create payment order");
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
                name: "PujaPath Store",
                description: "Product Purchase",
                order_id: razorpayOrderId,

                handler: async function (response) {
                    try {
                        const verifyRes = await api.post(
                            "/product-booking/razorpay/verify",
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,

                                product_id: product.id,
                                quantity: product.qty,
                                address_id: selectedAddress.id,
                                ...payloadCharges,
                            },
                            { withCredentials: true }
                        );

                        if (verifyRes.data.success) {
                            alert("✅ Payment Success & Product Booked!");
                            console.log("Booking:", verifyRes.data.data);

                            navigate("/")

                        } else {
                            alert("❌ Payment verification failed");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("❌ Verification failed");
                    }
                },

                prefill: {
                    name: selectedAddress.full_name,
                    contact: selectedAddress.phone_number,
                },

                theme: {
                    color: "#0d6efd",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Place Order Error:", error);
            alert("❌ Something went wrong!");
        }
    };


    const [me, setMe] = useState(null);

    const fetchAuthenticateUser = async () => {
        const res = await api.get("/auth/checkUserLogin");
        setMe(res?.data?.data);
    };

    useEffect(() => {
        fetchAuthenticateUser();
    }, []);



    return (
        <div style={{ padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>
            {/* <h2 style={{ marginBottom: 20 }}>🛒 Checkout</h2> */}

            {loadingProduct ? (
                <div
                    style={{
                        padding: 20,
                        background: "white",
                        borderRadius: 10,
                        textAlign: "center",
                    }}
                >
                    <h3>Loading product...</h3>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: 20,
                    }}
                >
                    {/* ✅ Left Side */}
                    <div>
                        {/* ✅ CART ITEMS */}
                        <div
                            style={{
                                background: "white",
                                padding: 15,
                                borderRadius: 10,
                                marginBottom: 20,
                            }}
                        >
                            <h3>Cart Items</h3>

                            {cartItems.length === 0 ? (
                                <p>Your cart is empty</p>
                            ) : (
                                cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: "flex",
                                            gap: 15,
                                            borderBottom: "1px solid #eee",
                                            padding: "10px 0",
                                            alignItems: "center",
                                        }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 8,
                                                objectFit: "cover",
                                            }}
                                        />

                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0 }}>{item.name}</h4>
                                            <p style={{ margin: "5px 0" }}>₹ {item.price}</p>

                                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <button onClick={() => updateQty(item.id, "dec")}>-</button>
                                                <b>{item.qty}</b>
                                                <button onClick={() => updateQty(item.id, "inc")}>+</button>
                                            </div>
                                        </div>

                                        <div>
                                            <b>₹ {item.price * item.qty}</b>
                                            <br />
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                style={{
                                                    marginTop: 5,
                                                    background: "red",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "5px 10px",
                                                    borderRadius: 6,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* ✅ SHIPPING ADDRESS SECTION */}
                        <div style={{ background: "white", padding: 15, borderRadius: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <h3>Shipping Address</h3>

                                <button
                                    onClick={() => setShowAddAddressForm((p) => !p)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 8,
                                        background: "#0d6efd",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    + Add New Address
                                </button>
                            </div>

                            {loadingAddress ? (
                                <p>Loading addresses...</p>
                            ) : addresses.length === 0 ? (
                                <p>No address found. Please add a new address.</p>
                            ) : (
                                <div style={{ marginTop: 10 }}>
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            style={{
                                                border: "1px solid #ddd",
                                                borderRadius: 10,
                                                padding: 12,
                                                marginBottom: 10,
                                                background:
                                                    selectedAddressId === addr.id ? "#e7f1ff" : "white",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => setSelectedAddressId(addr.id)}
                                        >
                                            <label style={{ display: "flex", gap: 10, cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name="shippingAddress"
                                                    checked={selectedAddressId === addr.id}
                                                    onChange={() => setSelectedAddressId(addr.id)}
                                                />

                                                <div>
                                                    <div style={{ fontWeight: "bold" }}>{addr.full_name}</div>
                                                    <div style={{ fontSize: 13, color: "#333" }}>
                                                        📞 {addr.phone_number}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: "#444" }}>
                                                        {addr.address}, {addr.city}, {addr.state} -{" "}
                                                        {addr.pincode}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ✅ Add Address Form */}
                            {showAddAddressForm && (
                                <div
                                    style={{
                                        marginTop: 20,
                                        padding: 15,
                                        borderRadius: 10,
                                        border: "1px solid #ddd",
                                        background: "#f8f9fa",
                                    }}
                                >
                                    <h4>Add New Address</h4>

                                    <div style={{ display: "grid", gap: 10 }}>
                                        <input
                                            placeholder="Full Name"
                                            value={newAddress.full_name}
                                            onChange={(e) =>
                                                setNewAddress({ ...newAddress, full_name: e.target.value })
                                            }
                                            style={{ padding: 10 }}
                                        />

                                        <input
                                            placeholder="Phone Number"
                                            value={newAddress.phone_number}
                                            onChange={(e) =>
                                                setNewAddress({
                                                    ...newAddress,
                                                    phone_number: e.target.value,
                                                })
                                            }
                                            style={{ padding: 10 }}
                                        />

                                        <textarea
                                            placeholder="Address"
                                            rows={3}
                                            value={newAddress.address}
                                            onChange={(e) =>
                                                setNewAddress({ ...newAddress, address: e.target.value })
                                            }
                                            style={{ padding: 10 }}
                                        />

                                        <div style={{ display: "flex", gap: 10 }}>
                                            <input
                                                placeholder="City"
                                                value={newAddress.city}
                                                onChange={(e) =>
                                                    setNewAddress({ ...newAddress, city: e.target.value })
                                                }
                                                style={{ padding: 10, flex: 1 }}
                                            />
                                            <input
                                                placeholder="State"
                                                value={newAddress.state}
                                                onChange={(e) =>
                                                    setNewAddress({ ...newAddress, state: e.target.value })
                                                }
                                                style={{ padding: 10, flex: 1 }}
                                            />
                                        </div>

                                        <input
                                            placeholder="Pincode"
                                            value={newAddress.pincode}
                                            onChange={(e) =>
                                                setNewAddress({ ...newAddress, pincode: e.target.value })
                                            }
                                            style={{ padding: 10 }}
                                        />

                                        <button
                                            onClick={handleCreateAddress}
                                            disabled={savingAddress}
                                            style={{
                                                padding: 12,
                                                background: savingAddress ? "#999" : "#198754",
                                                color: "white",
                                                border: "none",
                                                borderRadius: 8,
                                                cursor: savingAddress ? "not-allowed" : "pointer",
                                                fontSize: 15,
                                            }}
                                        >
                                            {savingAddress ? "Saving..." : "✅ Save Address"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ✅ Show selected shipping address */}
                            {selectedAddress && (
                                <div
                                    style={{
                                        marginTop: 15,
                                        padding: 12,
                                        borderRadius: 10,
                                        background: "#e6ffe6",
                                        border: "1px solid #b6ffb6",
                                    }}
                                >
                                    <h4 style={{ marginTop: 0 }}>✅ Selected Shipping Address</h4>
                                    <div style={{ fontWeight: "bold" }}>{selectedAddress.full_name}</div>
                                    <div>📞 {selectedAddress.phone_number}</div>
                                    <div>
                                        {selectedAddress.address}, {selectedAddress.city},{" "}
                                        {selectedAddress.state} - {selectedAddress.pincode}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Right Side Summary */}
                    <div
                        style={{
                            background: "white",
                            padding: 15,
                            borderRadius: 10,
                            height: "fit-content",
                        }}
                    >
                        <h3>Order Summary</h3>

                        <p>
                            Subtotal: <b>₹ {subtotal}</b>
                        </p>
                        <p>
                            Shipping: <b>₹ {shipping}</b>
                        </p>
                        <p>
                            Tax (5%): <b>₹ {tax}</b>
                        </p>
                        <p>
                            Platform Fee: <b>₹ {platformFee}</b>
                        </p>
                        <hr />

                        <h2>Total: ₹ {total}</h2>

                        {/* ✅ Payment Method */}
                        <div style={{ marginTop: 15 }}>
                            <h4>Payment Method</h4>

                            <label style={{ display: "block" }}>
                                <input
                                    type="radio"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                />
                                Cash on Delivery
                            </label>

                            <label style={{ display: "block" }}>
                                <input
                                    type="radio"
                                    checked={paymentMethod === "ONLINE"}
                                    onChange={() => setPaymentMethod("ONLINE")}
                                />
                                Online Payment
                            </label>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            style={{
                                width: "100%",
                                marginTop: 15,
                                padding: 12,
                                background: "#198754",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 16,
                            }}
                        >
                            ✅ Place Order
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
