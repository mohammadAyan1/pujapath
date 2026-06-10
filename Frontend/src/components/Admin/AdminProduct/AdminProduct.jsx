import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { FaInfoCircle, FaEdit, FaPlus, FaRupeeSign } from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import api from "../../../api/axios";

const AdminProduct = () => {
  const firstRun = useRef(true);
  const imageAPi = import.meta.env.VITE_BACKEND_FOR_URL;
  const [activeTab, setActiveTab] = useState("form");
  const [showActive, setShowActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState("right");
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    product_category_id: "",
    name: "",
    price: "",
    stock: "",
    description: "",
    image: null,
    status: "active",
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  /* ===============================
     FETCH ALL PRODUCTS
  =============================== */
  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      // Get products based on current filter
      const endpoint = showActive
        ? "/product?status=active"
        : "/product?status=inactive";
      const res = await api.get(endpoint);
      if (res?.data?.success) {
        setProducts(res?.data?.data || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     FETCH ALL CATEGORIES
  =============================== */
  const fetchAllCategories = async () => {
    try {
      setCategoryLoading(true);
      const res = await api.get("/product-category?status=active");
      if (res?.data?.success) {
        setCategories(res?.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    fetchAllProducts();
    fetchAllCategories();
  }, [showActive]); // Refetch when filter changes

  /* ===============================
     CALCULATE TOOLTIP POSITION
  =============================== */
  const calculateTooltipPosition = (e, product) => {
    if (!e.target) return;

    const iconRect = e.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipWidth = 320;
    const tooltipHeight = 300;

    const spaceOnRight = viewportWidth - iconRect.right;
    const spaceOnLeft = iconRect.left;
    const spaceOnBottom = viewportHeight - iconRect.bottom;
    const spaceOnTop = iconRect.top;

    let x, y;
    let side = "right";

    if (spaceOnRight >= tooltipWidth || spaceOnRight > spaceOnLeft) {
      side = "right";
      x = iconRect.right + 10;
    } else {
      side = "left";
      x = iconRect.left - tooltipWidth - 10;
    }

    if (spaceOnBottom >= tooltipHeight || spaceOnBottom > spaceOnTop) {
      y = iconRect.top;
    } else {
      y = iconRect.top - tooltipHeight + iconRect.height;
    }

    x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10));

    setTooltipPosition({ x, y });
    setTooltipSide(side);
  };

  /* ===============================
     TOOLTIP HANDLERS
  =============================== */
  const handleDetailsHover = (product, e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      calculateTooltipPosition(e, product);
      setHoveredProduct(product);
    }, 200);
  };

  const handleIconLeave = () => {
    if (!isTooltipHovered) {
      startLeaveTimeout();
    }
  };

  const handleTooltipEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsTooltipHovered(true);
  };

  const handleTooltipLeave = () => {
    setIsTooltipHovered(false);
    startLeaveTimeout();
  };

  const startLeaveTimeout = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredProduct(null);
      setIsTooltipHovered(false);
    }, 300);
  };

  const handleTouchStart = (product, e) => {
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoveredProduct && hoveredProduct.id === product.id) {
      setHoveredProduct(null);
      setIsTooltipHovered(false);
    } else {
      calculateTooltipPosition(e, product);
      setHoveredProduct(product);
      setIsTooltipHovered(true);
    }
  };

  /* ===============================
     FORM HANDLERS
  =============================== */
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "file") {
      const file = e.target.files[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setFormData((prev) => ({
          ...prev,
          image: file,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.product_category_id ||
      !formData.name ||
      !formData.price ||
      !formData.stock
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (formData.stock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
        "product_category_id",
        formData.product_category_id,
      );
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("status", formData.status);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      let res;
      if (isEditMode && editingId) {
        // Update product
        res = await api.put(`/product/${editingId}`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res?.data?.success) {
          toast.success("Product updated successfully");
          resetForm();
          fetchAllProducts();
          setActiveTab("table");
        }
      } else {
        // Create new product
        res = await api.post("/product", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res?.data?.success) {
          toast.success("Product created successfully");
          resetForm();
          fetchAllProducts();
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  };

  /* ===============================
     RESET FORM
  =============================== */
  const resetForm = () => {
    setFormData({
      product_category_id: "",
      name: "",
      price: "",
      stock: "",
      description: "",
      image: null,
      status: "active",
    });
    setImagePreview(null);
    setIsEditMode(false);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ===============================
     HANDLE EDIT
  =============================== */
  const handleEdit = (product) => {
    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(product.id);

    // Set image preview if image exists
    if (product.image) {
      // setImagePreview(`${imageAPi}/${product.image}`);
      setImagePreview(`${imageAPi}${product.image}`);
    }

    setFormData({
      product_category_id: product.product_category_id || "",
      name: product.name || "",
      price: product.price || "",
      stock: product.stock || "",
      description: product.description || "",
      image: null,
      status: product.status || "active",
    });
  };

  /* ===============================
     HANDLE STATUS TOGGLE
  =============================== */
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await api.patch(`/product/${id}/status`, {
        status: newStatus,
      });

      if (res?.data?.success) {
        toast.success(
          `Product ${newStatus === "active" ? "activated" : "deactivated"}`,
        );
        // Refresh the product list
        fetchAllProducts();
      } else {
        toast.error(res?.data?.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  /* ===============================
     GET CATEGORY NAME
  =============================== */
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id == categoryId);
    return category ? category.name : "Unknown Category";
  };

  /* ===============================
     EFFECT FOR CLEANUP
  =============================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        !e.target.closest(".details-icon")
      ) {
        setHoveredProduct(null);
        setIsTooltipHovered(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);

      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow">
      {/* TABS */}
      <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("form");
            resetForm();
          }}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "form"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-gray-500"
            }`}
        >
          {isEditMode ? "Edit Product" : "Add Product"}
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "table"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-gray-500"
            }`}
        >
          Product List
        </button>
      </div>

      {/* ================= FORM ================= */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 md:px-4 md:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BiCategory className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="product_category_id"
                    value={formData.product_category_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={categoryLoading}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {categoryLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading categories...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Quantity"
                    min="0"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image{" "}
                  {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    required={!isEditMode}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto border"
                        />
                        <p className="text-sm text-gray-600">
                          Click to change image
                        </p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <FaPlus className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">
                          Click to upload product image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-2">
                    Leave empty to keep current image
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 pt-4 border-t">
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm md:text-base font-medium flex items-center gap-2"
            >
              {isEditMode ? (
                <>
                  <FaEdit /> Update Product
                </>
              ) : (
                <>
                  <FaPlus /> Add Product
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              Reset Form
            </button>
          </div>
        </form>
      )}

      {/* ================= TABLE ================= */}
      {activeTab === "table" && (
        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Product List</h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowActive(!showActive)}
                className={`px-4 py-2 border rounded-lg transition-colors text-sm md:text-base font-medium ${showActive
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-600 text-white hover:bg-gray-700"
                  }`}
              >
                Showing: {showActive ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => {
                  setActiveTab("form");
                  resetForm();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
              >
                <FaPlus /> Add New
              </button>
            </div>
          </div>

          {/* DETAILS TOOLTIP */}
          {hoveredProduct && (
            <div
              ref={tooltipRef}
              className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 md:p-4 w-[280px] md:w-96 max-h-[80vh] overflow-y-auto ${tooltipSide === "right" ? "ml-2" : "mr-2"
                }`}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                pointerEvents: "auto",
              }}
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                {hoveredProduct.image ? (
                  <img
                    // src={`${imageAPi}/${hoveredProduct.image}`}
                    src={`${imageAPi}${hoveredProduct.image}`}
                    alt={hoveredProduct.name}
                    className="w-20 h-20 object-cover rounded-lg mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-base md:text-lg text-gray-800">
                    {hoveredProduct.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {hoveredProduct.category_name ||
                      getCategoryName(hoveredProduct.product_category_id)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <p className="text-gray-800 font-bold">
                      ₹{hoveredProduct.price}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Stock:</span>
                    <p
                      className={`font-bold ${hoveredProduct.stock <= 10
                        ? "text-red-600"
                        : "text-green-600"
                        }`}
                    >
                      {hoveredProduct.stock} units
                    </p>
                  </div>
                </div>

                {hoveredProduct.description && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Description:
                    </span>
                    <p className="text-gray-700 mt-1">
                      {hoveredProduct.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${hoveredProduct.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {hoveredProduct.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created:{" "}
                  {new Date(hoveredProduct.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => {
                  setHoveredProduct(null);
                  setIsTooltipHovered(false);
                }}
                className="md:hidden mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="mt-2 text-gray-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                No {showActive ? "active" : "inactive"} products found
              </p>
              <button
                onClick={() => {
                  setActiveTab("form");
                  resetForm();
                }}
                className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border min-w-[800px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      #
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Image
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Product Name
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Category
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Price
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Stock
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Status
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Actions
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border p-2">
                        {product.image ? (
                          <img
                            // src={`${imageAPi}/${product.image}`}
                            src={`${imageAPi}${product.image}`}
                            alt={product.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="border p-2">
                        <div className="font-medium text-xs md:text-sm text-gray-800">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {product.category_name ||
                          getCategoryName(product.product_category_id)}
                      </td>
                      <td className="border p-2">
                        <div className="font-bold text-xs md:text-sm text-orange-600">
                          ₹{product.price}
                        </div>
                      </td>
                      <td className="border p-2">
                        <div
                          className={`font-bold text-xs md:text-sm ${product.stock <= 10
                            ? "text-red-600"
                            : "text-green-600"
                            }`}
                        >
                          {product.stock} units
                        </div>
                        {product.stock <= 10 && product.stock > 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            Low Stock
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            Out of Stock
                          </div>
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() =>
                            handleStatusToggle(product.id, product.status)
                          }
                          className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors w-full ${product.status === "active"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-500 hover:bg-gray-600"
                            }`}
                        >
                          {product.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm flex items-center gap-1 w-full justify-center"
                            title="Edit"
                          >
                            <FaEdit size={12} /> Edit
                          </button>
                        </div>
                      </td>
                      <td className="border p-2 text-center">
                        <div
                          className="details-icon inline-flex items-center justify-center"
                          onMouseEnter={(e) => handleDetailsHover(product, e)}
                          onMouseLeave={handleIconLeave}
                          onTouchStart={(e) => handleTouchStart(product, e)}
                        >
                          <FaInfoCircle
                            className="text-blue-500 text-lg md:text-xl cursor-pointer hover:text-blue-700 transition-colors"
                            title="View Details (Hover/Tap)"
                          />
                          <span className="md:hidden text-xs text-gray-500 ml-1">
                            Tap
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProduct;
