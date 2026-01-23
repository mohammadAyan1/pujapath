import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { FaInfoCircle, FaPlus } from "react-icons/fa";
import api from "../../../api/axios";

const AdminTemple = () => {
  const firstRun = useRef(true);
  const imageAPi = import.meta.env.VITE_BACKEND_FOR_URL;
  const [activeTab, setActiveTab] = useState("form");
  const [hasLive, setHasLive] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hoveredTemple, setHoveredTemple] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState("right");
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const fileInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    area: "",
    openingTime: "",
    closingTime: "",
    description: "",
    hasLive: false,
    liveLink: "",
    image: null,
    status: "active",
  });

  const [temples, setTemples] = useState([]);


  const fetchAllTemple = async () => {
    try {
      const endpoint = showActive
        ? "/temple?status=active"
        : "/temple?status=inactive";

      const res = await api.get(endpoint);

      if (res?.data?.success) {
        setTemples(res?.data?.data || []);
      } else {
        toast.error("Failed to fetch temples");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch temples");
    }
  };



  useEffect(() => {
    fetchAllTemple();
  }, [showActive]);


  /* ===============================
     CALCULATE TOOLTIP POSITION
  =============================== */
  const calculateTooltipPosition = (e, temple) => {
    if (!e.target) return;

    const iconRect = e.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default tooltip dimensions (estimate)
    const tooltipWidth = 320;
    const tooltipHeight = 300;

    // Calculate available space on right and left
    const spaceOnRight = viewportWidth - iconRect.right;
    const spaceOnLeft = iconRect.left;

    // Calculate available space on bottom and top
    const spaceOnBottom = viewportHeight - iconRect.bottom;
    const spaceOnTop = iconRect.top;

    let x, y;
    let side = "right";

    // Determine horizontal position
    if (spaceOnRight >= tooltipWidth || spaceOnRight > spaceOnLeft) {
      // Show on right
      side = "right";
      x = iconRect.right + 10;
    } else {
      // Show on left
      side = "left";
      x = iconRect.left - tooltipWidth - 10;
    }

    // Determine vertical position
    if (spaceOnBottom >= tooltipHeight || spaceOnBottom > spaceOnTop) {
      // Show below
      y = iconRect.top;
    } else {
      // Show above
      y = iconRect.top - tooltipHeight + iconRect.height;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10));

    setTooltipPosition({ x, y });
    setTooltipSide(side);
  };

  /* ===============================
     HANDLE MOUSE ENTER FOR DETAILS ICON
  =============================== */
  const handleDetailsHover = (temple, e) => {
    // Clear any pending leave timeouts
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      calculateTooltipPosition(e, temple);
      setHoveredTemple(temple);
    }, 200);
  };

  /* ===============================
     HANDLE MOUSE LEAVE FROM ICON
  =============================== */
  const handleIconLeave = () => {
    // Only start leave timeout if tooltip is not being hovered
    if (!isTooltipHovered) {
      startLeaveTimeout();
    }
  };

  /* ===============================
     HANDLE MOUSE ENTER TOOLTIP
  =============================== */
  const handleTooltipEnter = () => {
    // Clear any pending leave timeouts when entering tooltip
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsTooltipHovered(true);
  };

  /* ===============================
     HANDLE MOUSE LEAVE TOOLTIP
  =============================== */
  const handleTooltipLeave = () => {
    setIsTooltipHovered(false);
    startLeaveTimeout();
  };

  /* ===============================
     START LEAVE TIMEOUT
  =============================== */
  const startLeaveTimeout = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredTemple(null);
      setIsTooltipHovered(false);
    }, 300); // Delay before hiding tooltip
  };

  /* ===============================
     HANDLE TOUCH FOR MOBILE
  =============================== */
  const handleTouchStart = (temple, e) => {
    e.preventDefault();
    // Clear timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoveredTemple && hoveredTemple.id === temple.id) {
      setHoveredTemple(null);
      setIsTooltipHovered(false);
    } else {
      calculateTooltipPosition(e, temple);
      setHoveredTemple(temple);
      setIsTooltipHovered(true);
    }
  };

  /* ===============================
     CLOSE TOOLTIP ON CLICK OUTSIDE
  =============================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        !e.target.closest(".details-icon")
      ) {
        setHoveredTemple(null);
        setIsTooltipHovered(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);

      // Clean up timeouts
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  /* ===============================
     HANDLE FORM CHANGE
  =============================== */
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files && files[0]) {
      const file = files[0];
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    } else if (type === "checkbox") {
      if (name === "hasLive") {
        setHasLive(checked);
      }
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /* ===============================
     HANDLE SUBMIT
  =============================== */
  const handleOnSubmit = async (e) => {
    try {
      e.preventDefault();

      // Create FormData for file upload
      const submitFormData = new FormData();

      // Append all form data
      Object.keys(formData).forEach((key) => {
        if (key === "image" && formData[key]) {
          submitFormData.append("image", formData[key]);
        } else {
          submitFormData.append(key, formData[key]);
        }
      });

      let res;
      if (isEditMode && editingId) {
        // Update existing temple
        res = await api.put(`/temple/${editingId}`, submitFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Create new temple
        res = await api.post("/temple", submitFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (res?.data?.success) {
        toast.success(res?.data?.message);
        resetForm();
        fetchAllTemple();
        if (isEditMode) {
          setActiveTab("table");
        }
      } else {
        toast.error(res?.data?.message || "Something went wrong");
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
      state: "",
      city: "",
      area: "",
      openingTime: "",
      closingTime: "",
      description: "",
      hasLive: false,
      liveLink: "",
      image: null,
      status: "active",
    });
    setHasLive(false);
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
  const handleEdit = (temple) => {


    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(temple.id);
    setHasLive(temple.has_live === 1);

    // Set image preview if image exists
    if (temple.image) {
      setImagePreview(`${imageAPi}/${temple.image}`);
    } else {
      setImagePreview(null);
    }

    setFormData({
      name: temple.name || "",
      state: temple.state || "",
      city: temple.city || "",
      area: temple.area || "",
      openingTime: temple.opening_time || "",
      closingTime: temple.closing_time || "",
      description: temple.description || "",
      hasLive: temple.has_live === 1,
      liveLink: temple.live_url || "",
      image: null, // Don't prefill the file input
      status: temple.status || "active",
    });
  };

  /* ===============================
     HANDLE DELETE
  =============================== */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this temple?")) {
      try {
        const res = await api.delete(`/temple/${id}`);

        if (res?.data?.success) {
          toast.success(res?.data?.message);
          fetchAllTemple(); // Refresh the list
        } else {
          toast.error(res?.data?.message || "Failed to delete temple");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "An error occurred");
      }
    }
  };

  /* ===============================
     HANDLE STATUS TOGGLE
  =============================== */
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await api.put(`/temple/${id}`, { status: newStatus });

      if (res?.data?.success) {
        toast.success(
          `Temple ${newStatus === "active" ? "activated" : "deactivated"}`,
        );
        fetchAllTemple();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  /* ===============================
     FILTER TABLE
  =============================== */
  const filteredTemples = temples.filter(
    (t) => t.status === (showActive ? "active" : "inactive"),
  );

  return (
    <div className="max-w-5xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow">
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
          {isEditMode ? "Edit Temple" : "Add Temple"}
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "table"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-gray-500"
            }`}
        >
          Temple List
        </button>
      </div>

      {/* ================= FORM ================= */}
      {activeTab === "form" && (
        <form onSubmit={handleOnSubmit} className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">
              {isEditMode ? "Edit Temple" : "Add Temple"}
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

          <input
            name="name"
            placeholder="Temple Name"
            value={formData?.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm md:text-base"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <input
              name="state"
              placeholder="State"
              value={formData?.state}
              onChange={handleChange}
              className="border px-3 py-2 rounded text-sm md:text-base"
              required
            />
            <input
              name="city"
              placeholder="City"
              value={formData?.city}
              onChange={handleChange}
              className="border px-3 py-2 rounded text-sm md:text-base"
              required
            />
            <input
              name="area"
              placeholder="Area"
              onChange={handleChange}
              value={formData?.area}
              className="border px-3 py-2 rounded text-sm md:text-base"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm mb-1">Opening Time</label>
              <input
                type="time"
                name="openingTime"
                onChange={handleChange}
                value={formData?.openingTime}
                required
                className="w-full border px-3 py-2 rounded text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Closing Time</label>
              <input
                type="time"
                name="closingTime"
                onChange={handleChange}
                value={formData?.closingTime}
                required
                className="w-full border px-3 py-2 rounded text-sm md:text-base"
              />
            </div>
          </div>

          <textarea
            name="description"
            placeholder="Description"
            rows="3"
            onChange={handleChange}
            value={formData?.description}
            className="w-full border px-3 py-2 rounded text-sm md:text-base"
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasLive"
              name="hasLive"
              checked={hasLive}
              onChange={handleChange}
            />
            <label htmlFor="hasLive" className="text-sm md:text-base">
              Has Live Darshan
            </label>
          </div>

          {hasLive && (
            <input
              name="liveLink"
              placeholder="Live Darshan Link"
              value={formData?.liveLink}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded text-sm md:text-base"
              required={hasLive}
            />
          )}

          <div>
            <label className="block text-sm mb-1">Temple Image</label>
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              onChange={handleChange}
              accept="image/*"
              className="w-full border px-3 py-2 rounded text-sm md:text-base"
              required={!isEditMode}
            />
            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm mb-1">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 md:w-32 md:h-32 object-cover rounded border"
                />
              </div>
            )}
            {isEditMode && (
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to keep current image
              </p>
            )}
          </div>

          <div className="flex gap-3 md:gap-4">
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 md:px-6 md:py-2 rounded hover:bg-orange-700 text-sm md:text-base"
            >
              {isEditMode ? "Update Temple" : "Submit"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm md:text-base"
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
            <h2 className="text-lg md:text-xl font-bold">Temple List</h2>

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

          {/* DETAILS TOOLTIP */}
          {hoveredTemple && (
            <div
              ref={tooltipRef}
              className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 md:p-4 w-[280px] md:w-96 max-h-[80vh] overflow-y-auto ${tooltipSide === "right" ? "ml-2" : "mr-2"
                }`}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                pointerEvents: "auto", // Ensure tooltip is interactive
              }}
              onMouseEnter={handleTooltipEnter}
              onMouseLeave={handleTooltipLeave}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
                {hoveredTemple.image ? (
                  <img
                    src={`${imageAPi}/${hoveredTemple.image}`}
                    alt={hoveredTemple.name}
                    className="w-16 h-16 object-cover rounded mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mx-auto sm:mx-0">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-base md:text-lg">
                    {hoveredTemple.name}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    {hoveredTemple.area}, {hoveredTemple.city},{" "}
                    {hoveredTemple.state}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs md:text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Opening:</span>
                    <p className="text-gray-700">
                      {hoveredTemple.opening_time || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Closing:</span>
                    <p className="text-gray-700">
                      {hoveredTemple.closing_time || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-gray-700 mt-1 line-clamp-3 text-xs md:text-sm">
                    {hoveredTemple.description || "No description"}
                  </p>
                </div>

                {hoveredTemple.has_live === 1 && hoveredTemple.live_url && (
                  <div>
                    <span className="font-medium">Live Darshan:</span>
                    <a
                      href={hoveredTemple.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block truncate text-xs md:text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Link
                    </a>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${hoveredTemple.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {hoveredTemple.status}
                  </span>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => {
                  setHoveredTemple(null);
                  setIsTooltipHovered(false);
                }}
                className="md:hidden mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
              >
                Close
              </button>
            </div>
          )}

          {temples.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No temples found</p>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border min-w-[600px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm">Image</th>
                    <th className="border p-2 text-xs md:text-sm">Name</th>
                    <th className="border p-2 text-xs md:text-sm">City</th>
                    <th className="border p-2 text-xs md:text-sm">Status</th>
                    <th className="border p-2 text-xs md:text-sm">Actions</th>
                    <th className="border p-2 text-xs md:text-sm">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {temples.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="border p-2">
                        {t.image ? (
                          <img
                            src={`${imageAPi}/${t.image}`}
                            alt={t.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-xs md:text-sm">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-gray-500 text-xs">
                          {t.area}, {t.city}
                        </div>
                      </td>
                      <td className="border p-2 text-xs md:text-sm">
                        {t.city}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleStatusToggle(t.id, t.status)}
                          className={`px-2 py-1 md:px-3 md:py-1 rounded text-white text-xs md:text-sm ${t.status === "active"
                            ? "bg-green-600"
                            : "bg-gray-500"
                            } hover:opacity-90`}
                        >
                          {t.status}
                        </button>
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(t)}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs md:text-sm"
                          >
                            Edit
                          </button>
                          {/* <button
                            onClick={() => handleDelete(t.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs md:text-sm"
                          >
                            Delete
                          </button> */}
                        </div>
                      </td>
                      <td className="border p-2 text-center">
                        <div
                          className="details-icon inline-flex items-center justify-center"
                          onMouseEnter={(e) => handleDetailsHover(t, e)}
                          onMouseLeave={handleIconLeave}
                          onTouchStart={(e) => handleTouchStart(t, e)}
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

export default AdminTemple;
