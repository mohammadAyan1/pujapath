
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { FaShoppingCart, FaBolt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../CartContext/CartContext";

const BASE_URL_IMAGE =
  import.meta.env.VITE_BACKEND_FOR_URL

const Products = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Infinite scroll pagination
  const [page, setPage] = useState(1);
  const limit = 8; // ✅ load 8 products per scroll
  const [hasMore, setHasMore] = useState(true);

  // Search & filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [category, setCategory] = useState([])

  const loaderRef = useRef(null);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return "/no-image.png";
    if (imgPath.startsWith("http")) return imgPath;
    return `${BASE_URL_IMAGE}/${imgPath}`;
  };


  useEffect(() => {
    console.log(selectedCategory);

  }, [selectedCategory])

  /* ✅ Fetch Products (next page) */
  const fetchProducts = async (pageNo = 1) => {
    try {
      setLoading(true);

      // ✅ user sees only ACTIVE products
      const res = await api.get(
        `/product?status=active&page=${pageNo}&limit=${limit}&category=${selectedCategory}&sortby=${sortBy}`
      );

      if (res?.data?.success) {
        const newData = res?.data?.data || [];

        setProducts((prev) => (pageNo === 1 ? newData : [...prev, ...newData]));

        // ✅ if received less than limit, no more pages
        if (newData.length < limit) setHasMore(false);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };


  const fetchAllProductCategory = async () => {
    try {

      setLoading(true);

      const res = await api.get("/product-category")

      if (res?.data?.success) {
        console.log(res);
        setCategory(res?.data?.data)

      } else {
        toast.error("Failed to fetch products Category");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch products Category");
    } finally {
      setLoading(false);
    }
  }

  /* ✅ First load */
  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory, sortBy]);


  useEffect(() => {
    fetchAllProductCategory();
  }, []);

  /* ✅ Infinite scroll observer */
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  /* ✅ When page increases load next page */
  useEffect(() => {
    if (page === 1) return;
    fetchProducts(page);
  }, [page]);

  /* ✅ Unique categories */
  const categories = useMemo(() => {
    // const cats = new Set();
    const cats = [];

    category.forEach((p) => {
      if (p?.name) cats.push({ name: p.name, id: p.id });
    });
    return ["all", ...Array.from(cats)];
  }, [products]);



  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product.id, 1);
  };

  const buyNow = async (product) => {
    await addToCart(product.id, 1);
    navigate(`/checkout/${product?.id}`);
  };


  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">


      {/* ✅ FILTERS */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">


          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-[180px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {categories.map((cat) => (
                <option key={cat?.id} value={cat?.id}>
                  {cat === "all" ? "All Categories" : cat?.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-[180px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="default">Sort: Default</option>
              <option value="latest">Latest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ✅ PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {products.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  <div className="h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = "/no-image.png";
                      }}
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {product.category_name && (
                      <p className="text-xs text-gray-500 mb-1">
                        {product.category_name}
                      </p>
                    )}

                    <h2 className="text-base font-semibold text-gray-800 line-clamp-2">
                      {product.name}
                    </h2>

                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-3">
                      <p className="text-lg font-bold text-orange-600">
                        ₹{product.price}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                      >
                        <FaShoppingCart /> Add to Cart
                      </button>

                      <button
                        onClick={() => buyNow(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                      >
                        <FaBolt /> Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ LOADER TRIGGER */}
            <div ref={loaderRef} className="h-10 mt-10 flex justify-center">
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  Loading more...
                </div>
              )}
            </div>

            {/* ✅ END MESSAGE */}
            {!hasMore && (
              <p className="text-center text-gray-500 mt-6">
                You have reached the end ✅
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
