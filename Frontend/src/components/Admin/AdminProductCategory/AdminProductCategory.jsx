import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { FaInfoCircle, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import api from "../../../api/axios";

const AdminProductCategory = () => {
  const firstRun = useRef(true);
  const [activeTab, setActiveTab] = useState("form");
  const [showActive, setShowActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState("right");
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     FETCH ALL CATEGORIES
  =============================== */
  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/product-category");
      if (res?.data?.success) {
        setCategories(res?.data?.data || []);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch categories",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    fetchAllCategories();
  }, []);

  /* ===============================
     CALCULATE TOOLTIP POSITION
  =============================== */
  const calculateTooltipPosition = (e, category) => {
    if (!e.target) return;

    const iconRect = e.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipWidth = 280;
    const tooltipHeight = 180;

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
  const handleDetailsHover = (category, e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      calculateTooltipPosition(e, category);
      setHoveredCategory(category);
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
      setHoveredCategory(null);
      setIsTooltipHovered(false);
    }, 300);
  };

  const handleTouchStart = (category, e) => {
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoveredCategory && hoveredCategory.id === category.id) {
      setHoveredCategory(null);
      setIsTooltipHovered(false);
    } else {
      calculateTooltipPosition(e, category);
      setHoveredCategory(category);
      setIsTooltipHovered(true);
    }
  };

  /* ===============================
     FORM HANDLERS
  =============================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      let res;
      if (isEditMode && editingId) {
        // Update category
        res = await api.put(`/product-category/${editingId}`, {
          name: formData.name,
          status: formData.status,
        });

        if (res?.data?.success) {
          toast.success(res?.data?.message);
          resetForm();
          fetchAllCategories();
          setActiveTab("table");
        }
      } else {
        // Create new category
        res = await api.post("/product-category", {
          name: formData.name,
        });

        if (res?.data?.success) {
          toast.success(res?.data?.message);
          resetForm();
          fetchAllCategories();
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
      name: "",
      status: "active",
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  /* ===============================
     HANDLE EDIT
  =============================== */
  const handleEdit = (category) => {
    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(category.id);

    setFormData({
      name: category.name || "",
      status: category.status || "active",
    });
  };

  /* ===============================
     HANDLE DELETE
  =============================== */
  const handleDelete = async (id, status) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          status == "active" ? "Inactive" : "active"
        } this category?`,
      )
    ) {
      try {
        const res = await api.delete(`/product-category/${id}`);

        if (res?.data?.success) {
          toast.success(res?.data?.message || "Category deleted successfully");
          fetchAllCategories();
        } else {
          toast.error(res?.data?.message || "Failed to delete category");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "An error occurred");
      }
    }
  };

  /* ===============================
     FILTER CATEGORIES
  =============================== */
  const filteredCategories = categories.filter(
    (cat) => cat.status === (showActive ? "active" : "inactive"),
  );

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
        setHoveredCategory(null);
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
    <div className="max-w-5xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow">
      {/* TABS */}
      <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("form");
            resetForm();
          }}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${
            activeTab === "form"
              ? "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500"
          }`}
        >
          {isEditMode ? "Edit Category" : "Add Category"}
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${
            activeTab === "table"
              ? "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500"
          }`}
        >
          Category List
        </button>
      </div>

      {/* ================= FORM ================= */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">
              {isEditMode ? "Edit Product Category" : "Add Product Category"}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 md:px-4 md:py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
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

          <div className="flex gap-3 md:gap-4 pt-4">
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm md:text-base font-medium flex items-center gap-2"
            >
              {isEditMode ? (
                <>
                  <FaEdit /> Update Category
                </>
              ) : (
                <>
                  <FaPlus /> Add Category
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* ================= TABLE ================= */}
      {activeTab === "table" && (
        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Product Categories</h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowActive(!showActive)}
                className={`px-4 py-2 border rounded-lg transition-colors text-sm md:text-base font-medium ${
                  showActive
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
          {hoveredCategory && (
            <div
              ref={tooltipRef}
              className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 md:p-4 w-[280px] md:w-80 max-h-[80vh] overflow-y-auto ${
                tooltipSide === "right" ? "ml-2" : "mr-2"
              }`}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                pointerEvents: "auto",
              }}
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
            >
              <div className="mb-3">
                <h3 className="font-bold text-base md:text-lg text-gray-800">
                  {hoveredCategory.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  ID: {hoveredCategory.id}
                </p>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      hoveredCategory.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {hoveredCategory.status}
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <p className="font-medium text-gray-700 mb-1">Created:</p>
                  <p className="text-gray-600">
                    {new Date(hoveredCategory.created_at).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(hoveredCategory.created_at).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>

                {hoveredCategory.updated_at && (
                  <div className="pt-2 border-t">
                    <p className="font-medium text-gray-700 mb-1">
                      Last Updated:
                    </p>
                    <p className="text-gray-600">
                      {new Date(
                        hoveredCategory.updated_at,
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(hoveredCategory.updated_at).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => {
                  setHoveredCategory(null);
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
              <p className="mt-2 text-gray-500">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                No {showActive ? "active" : "inactive"} categories found
              </p>
              <button
                onClick={() => {
                  setActiveTab("form");
                  resetForm();
                }}
                className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
              >
                Add First Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border min-w-[600px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      #
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Name
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Status
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Created At
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
                  {filteredCategories.map((category, index) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border p-2">
                        <div className="font-medium text-xs md:text-sm text-gray-800">
                          {category.name}
                        </div>
                      </td>
                      <td className="border p-2">
                        <button
                          // onClick={() =>
                          //   handleStatusToggle(category.id, category.status)
                          // }
                          onClick={() =>
                            handleDelete(category.id, category?.status)
                          }
                          className={`px-2 py-1 md:px-3 md:py-1 rounded-lg text-white text-xs md:text-sm font-medium transition-colors ${
                            category.status === "active"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-500 hover:bg-gray-600"
                          }`}
                        >
                          {category.status}
                        </button>
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                            title="Edit"
                          >
                            <FaEdit size={12} /> Edit
                          </button>
                          {/* <button
                            onClick={() => handleDelete(category.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm flex items-center gap-1"
                            title="Delete"
                          >
                            <FaTrash size={12} /> Delete
                          </button> */}
                        </div>
                      </td>
                      <td className="border p-2 text-center">
                        <div
                          className="details-icon inline-flex items-center justify-center"
                          onMouseEnter={(e) => handleDetailsHover(category, e)}
                          onMouseLeave={handleIconLeave}
                          onTouchStart={(e) => handleTouchStart(category, e)}
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

export default AdminProductCategory;
