import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { getImageUrl } from "../../utils/getImageUrl";
import { useCart } from "../../CartContext/CartContext";
const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

export default function ProductDetail() {

    const { addToCart } = useCart()
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleAddToCart = (product) => {
        addToCart(product.id, 1);
    };

    const buyNow = async (product) => {
        await addToCart(product.id, 1);
        navigate(`/checkout/${product?.id}`);
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/product/${id}`);
            if (res?.data?.success) setProduct(res.data.data);
            else toast.error("Product not found");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Product load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    if (loading) return <div className="p-6">Loading product...</div>;
    if (!product) return <div className="p-6">No product found</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="text-sm text-orange-600 font-semibold mb-4"
            >
                ← Back
            </button>
            {
                product?.map((item, index) => (

                    <div key={index} className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row gap-5">
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

                            <p className="mt-2 text-xl font-bold text-gray-900">
                                ₹ {item.price}
                            </p>

                            <p className="mt-2 text-sm text-gray-600">
                                Stock:{" "}
                                <span className="font-semibold">
                                    {item.stock > 0 ? item.stock : "Out of stock"}
                                </span>
                            </p>

                            <p className="mt-4 text-gray-700">{item.description}</p>

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-semibold">
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => buyNow(item)}
                                    className="px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-semibold">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>


                ))
            }
        </div>
    );
}
