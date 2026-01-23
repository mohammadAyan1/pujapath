import React, { useMemo } from "react";
import { useCart } from "../../CartContext/CartContext";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

const BASE_URL_IMAGE =
    import.meta.env.VITE_BACKEND_FOR_URL

const getImageUrl = (imgPath) => {
    if (!imgPath) return "/no-image.png";
    if (imgPath.startsWith("http")) return imgPath;
    return `${BASE_URL_IMAGE}/${imgPath}`;
};

const Cart = () => {
    const {
        cartItems,
        cartLoading,
        updateCartQty,
        removeCartItem,
        clearCart,
    } = useCart();

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    }, [cartItems]);

    if (cartLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <p className="text-gray-600">Loading cart...</p>
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Your cart is empty 🛒</p>
                    <Link
                        to="/products"
                        className="inline-block mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg"
                    >
                        Go Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Cart</h1>

                <button
                    onClick={clearCart}
                    className="text-red-600 font-medium hover:underline"
                >
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT ITEMS */}
                <div className="md:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow p-4 flex gap-4"
                        >
                            <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-md border"
                                onError={(e) => {
                                    e.target.src = "/no-image.png";
                                }}
                            />

                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-800">{item.name}</h2>
                                <p className="text-sm text-gray-500">
                                    Price: ₹{item.price}
                                </p>

                                <div className="mt-3 flex items-center gap-3">
                                    {/* QTY */}
                                    <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                                        <button
                                            onClick={() =>
                                                updateCartQty(item.id, Math.max(1, item.quantity - 1))
                                            }
                                            className="p-2"
                                        >
                                            <FaMinus />
                                        </button>

                                        <span className="min-w-[30px] text-center font-semibold">
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() => {
                                                if (item.quantity + 1 > item.stock) return;
                                                updateCartQty(item.id, item.quantity + 1);
                                            }}
                                            className="p-2"
                                            disabled={item.quantity >= item.stock}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeCartItem(item.id)}
                                        className="flex items-center gap-2 text-red-600 hover:underline"
                                    >
                                        <FaTrash /> Remove
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-bold text-gray-800">
                                    ₹{Number(item.total_price).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Stock: {item.stock}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RIGHT SUMMARY */}
                <div className="bg-white rounded-lg shadow p-5 h-fit">
                    <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>

                    <div className="flex justify-between mt-4 text-gray-700">
                        <span>Total Items</span>
                        <span>{cartItems.length}</span>
                    </div>

                    <div className="flex justify-between mt-2 text-gray-700">
                        <span>Total Amount</span>
                        <span className="font-bold text-orange-600">
                            ₹{totalAmount.toFixed(2)}
                        </span>
                    </div>

                    <button className="w-full mt-5 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
