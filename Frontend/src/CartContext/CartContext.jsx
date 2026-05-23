import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const CartContext = createContext();

const generateGuestId = () => {
    return "guest_" + Math.random().toString(36).substring(2, 12) + Date.now();
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [cartLoading, setCartLoading] = useState(false);

    // ✅ keep guest id forever in localStorage
    const guestId = useMemo(() => {
        let id = localStorage.getItem("guestId");
        if (!id) {
            id = generateGuestId();
            localStorage.setItem("guestId", id);
        }
        return id;
    }, []);

    const fetchCart = async () => {
        try {
            setCartLoading(true);

            const res = await api.get(`/product-addtocard?guestId=${guestId}`);

            if (res?.data?.success) {
                setCartItems(res?.data?.data || []);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setCartLoading(false);
        }
    };

    const addToCart = async (product_id, quantity = 1) => {
        try {
            const res = await api.post("/product-addtocard", {
                guestId,
                product_id,
                quantity,
            });

            if (res?.data?.success) {
                toast.success("Added to cart ✅");
                fetchCart();
            } else {
                toast.error(res?.data?.message || "Failed to add");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add");
        }
    };

    const updateCartQty = async (cartId, quantity) => {
        try {
            const res = await api.put(`/product-addtocard/${cartId}`, {
                guestId,
                quantity,
            });

            if (res?.data?.success) {
                fetchCart();
            } else {
                toast.error(res?.data?.message || "Failed to update cart");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update cart");
        }
    };

    const removeCartItem = async (cartId) => {
        try {
            // ✅ easiest way: set qty = 0 not allowed, so delete one item query needed
            // but you don't have single delete route, so we'll do custom method below:
            const res = await api.delete(`/product-addtocard/item/${cartId}`, {
                data: { guestId },
            });

            if (res?.data?.success) {
                toast.success("Removed ✅");
                fetchCart();
            } else {
                toast.error(res?.data?.message || "Failed to remove");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to remove");
        }
    };

    const clearCart = async () => {
        try {
            const res = await api.delete("/product-addtocard", {
                data: { guestId },
            });

            if (res?.data?.success) {
                toast.success("Cart cleared ✅");
                fetchCart();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to clear cart");
        }
    };

    const cartCount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }, [cartItems]);

    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartLoading,
                cartCount,
                guestId,
                fetchCart,
                addToCart,
                updateCartQty,
                removeCartItem,
                clearCart,
                setCartItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
