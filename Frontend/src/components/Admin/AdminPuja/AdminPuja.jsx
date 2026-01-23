import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaInfoCircle,
  FaEdit,
  FaPlus,
  FaRupeeSign,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import { GiTempleGate } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import api from "../../../api/axios";

const AdminPuja = () => {
  const firstRun = useRef(true);
  const [activeTab, setActiveTab] = useState("form");
  const [showActive, setShowActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredPuja, setHoveredPuja] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState("right");
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [temples, setTemples] = useState([]);
  const [pujaCategories, setPujaCategories] = useState([]);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const [formData, setFormData] = useState({
    temple_id: "",
    puja_category_id: "",
    name: "",
    image: null, // ✅ add
    description: "",
    price: "",
    duration_minutes: "",
    slot: "",
    puja_date: "",
    start_time: "",
    status: "active",
  });





  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templesLoading, setTemplesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  /* ===============================
     FETCH ALL PUJAS
  =============================== */
  const fetchAllPujas = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/puja?status=${showActive ? "active" : "inactive"}`,
      );
      if (res?.data?.success) {
        setPujas(res?.data?.data || []);
      } else {
        toast.error("Failed to fetch pujas");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch pujas");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     FETCH ALL TEMPLES
  =============================== */
  const fetchAllTemples = async () => {
    try {
      setTemplesLoading(true);
      const res = await api.get("/temple");
      if (res?.data?.success) {
        setTemples(res?.data?.data?.filter((t) => t.status === "active") || []);
      }
    } catch (error) {
      console.error("Failed to fetch temples:", error);
    } finally {
      setTemplesLoading(false);
    }
  };

  /* ===============================
     FETCH ALL PUJA CATEGORIES
  =============================== */
  const fetchAllPujaCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get("/puja-category?status=active");
      if (res?.data?.success) {
        setPujaCategories(res?.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch puja categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    fetchAllPujas();
    fetchAllTemples();
    fetchAllPujaCategories();
  }, [showActive]);

  /* ===============================
     CONVERT MINUTES TO HOURS AND MINUTES
  =============================== */
  const convertMinutesToHoursAndMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return { hours, minutes: mins };
  };

  /* ===============================
     CALCULATE TOOLTIP POSITION
  =============================== */
  const calculateTooltipPosition = (e, puja) => {
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
  const handleDetailsHover = (puja, e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      calculateTooltipPosition(e, puja);
      setHoveredPuja(puja);
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
      setHoveredPuja(null);
      setIsTooltipHovered(false);
    }, 300);
  };

  const handleTouchStart = (puja, e) => {
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoveredPuja && hoveredPuja.id === puja.id) {
      setHoveredPuja(null);
      setIsTooltipHovered(false);
    } else {
      calculateTooltipPosition(e, puja);
      setHoveredPuja(puja);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      image: file,
    }));
  };


  const handleDurationHoursChange = (e) => {
    const hours = parseInt(e.target.value) || 0;
    setDurationHours(hours);
    const totalMinutes = hours * 60 + durationMinutes;
    setFormData((prev) => ({
      ...prev,
      duration_minutes: totalMinutes.toString(),
    }));
  };

  const handleDurationMinutesChange = (e) => {
    const minutes = parseInt(e.target.value) || 0;
    setDurationMinutes(minutes);
    const totalMinutes = durationHours * 60 + minutes;
    setFormData((prev) => ({
      ...prev,
      duration_minutes: totalMinutes.toString(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.temple_id ||
      !formData.puja_category_id ||
      !formData.name ||
      !formData.price ||
      !formData.duration_minutes ||
      !formData.slot ||
      !formData.start_time ||
      !formData?.description
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    if (formData.slot <= 0) {
      toast.error("Slot must be greater than 0");
      return;
    }

    try {

      const sendData = new FormData();

      sendData.append("temple_id", formData.temple_id);
      sendData.append("puja_category_id", formData.puja_category_id);
      sendData.append("name", formData.name);
      sendData.append("description", formData.description);
      sendData.append("price", formData.price);
      sendData.append("duration_minutes", formData.duration_minutes);
      sendData.append("slot", formData.slot);
      sendData.append("puja_date", formData.puja_date);
      sendData.append("start_time", formData.start_time);
      sendData.append("status", formData.status);

      // ✅ only append image if selected
      if (formData.image) {
        sendData.append("image", formData.image);
      }


      let res;
      if (isEditMode && editingId) {
        // Update puja
        // res = await api.put(`/puja/${editingId}`, {
        //   ...formData,
        //   status: formData.status,
        // });

        res = await api.put(`/puja/${editingId}`, sendData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res?.data?.success) {
          toast.success("Puja updated successfully");
          resetForm();
          fetchAllPujas();
          setActiveTab("table");
        }
      } else {
        // Create new puja
        // res = await api.post("/puja", formData);
        res = await api.post("/puja", sendData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res?.data?.success) {
          toast.success("Puja created successfully");
          resetForm();
          fetchAllPujas();
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
      temple_id: "",
      puja_category_id: "",
      name: "",
      image: null,
      price: "",
      duration_minutes: "",
      slot: "",
      puja_date: "",
      start_time: "",
      status: "active",
    });
    setDurationHours(0);
    setDurationMinutes(0);
    setIsEditMode(false);
    setEditingId(null);
  };

  /* ===============================
     HANDLE EDIT
  =============================== */
  const handleEdit = (puja) => {
    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(puja.id);


    // Convert minutes to hours and minutes
    const durationObj = convertMinutesToHoursAndMinutes(
      parseInt(puja.duration) || 0,
    );
    setDurationHours(durationObj.hours);
    setDurationMinutes(durationObj.minutes);

    // Format date for input field (YYYY-MM-DD)
    const formattedDate = puja.puja_date
      ? new Date(puja.puja_date).toISOString().split("T")[0]
      : "";

    setFormData({
      temple_id: puja.temple_id || "",
      puja_category_id: puja.puja_category_id || "",
      name: puja.name || "",
      price: puja.price || "",
      duration_minutes: puja.duration || "",
      slot: puja.slot || "",
      description: puja.description || "",
      puja_date: formattedDate,
      start_time: puja.start_time || "",
      status: puja.status || "active",
    });
  };

  /* ===============================
     HANDLE STATUS TOGGLE
  =============================== */
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await api.patch(`/puja/status/${id}`, {
        status: newStatus,
      });

      if (res?.data?.success) {
        toast.success(
          `Puja ${newStatus === "active" ? "activated" : "deactivated"
          } successfully`,
        );
        fetchAllPujas();
      } else {
        toast.error(res?.data?.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  /* ===============================
     GET TEMPLE NAME
  =============================== */
  const getTempleName = (templeId) => {
    const temple = temples.find((t) => t.id == templeId);
    return temple ? temple.name : "Unknown Temple";
  };

  /* ===============================
     GET CATEGORY NAME
  =============================== */
  const getCategoryName = (categoryId) => {
    const category = pujaCategories.find((c) => c.id == categoryId);
    return category || null;
  };

  /* ===============================
     FORMAT TIME
  =============================== */
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const time = timeString.split(":");
    let hours = parseInt(time[0]);
    const minutes = time[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  /* ===============================
     FORMAT DURATION
  =============================== */
  const formatDuration = (minutes) => {
    if (!minutes) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
    }
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
        setHoveredPuja(null);
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
          {isEditMode ? "Edit Puja" : "Add Puja"}
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "table"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-gray-500"
            }`}
        >
          Puja List
        </button>
      </div>

      {/* ================= FORM ================= */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">
              {isEditMode ? "Edit Puja" : "Add New Puja"}
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
                  Temple <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GiTempleGate className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="temple_id"
                    value={formData.temple_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={templesLoading}
                  >
                    <option value="">Select Temple</option>
                    {temples.map((temple) => (
                      <option key={temple.id} value={temple.id}>
                        {temple.name} - {temple.city}
                      </option>
                    ))}
                  </select>
                </div>
                {templesLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading temples...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puja Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BiCategory className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="puja_category_id"
                    value={formData.puja_category_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={categoriesLoading}
                  >
                    <option value="">Select Category</option>
                    {pujaCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {categoriesLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading categories...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puja Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter puja name"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puja Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  type="text"
                  rows={6}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter puja Description"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puja Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />

                {isEditMode && pujas?.find((p) => p.id === editingId)?.image && (
                  <img
                    src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${pujas.find((p) => p.id === editingId)?.image}`}
                    alt="puja"
                    className="mt-2 w-24 h-24 object-cover rounded-lg border"
                  />
                )}
              </div>


              <div className="grid grid-cols-3 gap-4">
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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={durationHours}
                        onChange={handleDurationHoursChange}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {Array.from({ length: 25 }, (_, i) => (
                          <option key={i} value={i}>
                            {i} hour{i !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={durationMinutes}
                        onChange={handleDurationMinutesChange}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {[0, 15, 30, 45].map((min) => (
                          <option key={min} value={min}>
                            {min} minutes
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {formatDuration(formData.duration_minutes)}
                    {formData.duration_minutes > 0 &&
                      ` (${formData.duration_minutes} minutes)`}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slots <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="slot"
                  value={formData.slot}
                  onChange={handleChange}
                  placeholder="Available slots"
                  min="1"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puja Date
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="puja_date"
                      value={formData.puja_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
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

              <div className="pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Summary:
                </p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Temple:</span>{" "}
                    {formData.temple_id
                      ? getTempleName(formData.temple_id)
                      : "Not selected"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Category:</span>{" "}
                    {formData.puja_category_id
                      ? getCategoryName(formData.puja_category_id)?.name
                      : "Not selected"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Price:</span> ₹
                    {formData.price || "0"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duration:</span>{" "}
                    {formatDuration(formData.duration_minutes)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Slots:</span>{" "}
                    {formData.slot || "0"}
                  </p>
                  {formData.puja_date && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(formData.puja_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
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
                  <FaEdit /> Update Puja
                </>
              ) : (
                <>
                  <FaPlus /> Add Puja
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
            <h2 className="text-lg md:text-xl font-bold">Puja List</h2>

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
          {hoveredPuja && (
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
              <div className="mb-3">
                <div className="flex justify-between">
                  <h3 className="font-bold text-base md:text-lg text-gray-800">
                    {hoveredPuja.name}
                  </h3>
                  <div className="">
                    <img className="w-20" src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${hoveredPuja?.image}`} alt="puja image" />
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mt-1">
                  <p>
                    <span className="font-medium">Temple:</span>{" "}
                    {getTempleName(hoveredPuja.temple_id)}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {getCategoryName(hoveredPuja.puja_category_id)?.name || "Unknown Category"}
                  </p>

                  <p>
                    <span className="font-medium">Puja Category Description:</span>{" "}
                    {getCategoryName(hoveredPuja.puja_category_id)?.description || "N/A"}
                  </p>


                  <p>
                    <span className="font-medium">Puja Description:</span>{" "}
                    {hoveredPuja.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <p className="text-gray-800 font-bold">
                      ₹{hoveredPuja.price}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-800">
                      {formatDuration(hoveredPuja.duration)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-700">Slots:</span>
                    <p className="text-gray-800">
                      {hoveredPuja.slot} available
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Start Time:
                    </span>
                    <p className="text-gray-800">
                      {formatTime(hoveredPuja.start_time)}
                    </p>
                  </div>
                </div>

                {hoveredPuja.puja_date && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Puja Date:
                    </span>
                    <p className="text-gray-800">
                      {new Date(hoveredPuja.puja_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${hoveredPuja.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {hoveredPuja.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created:{" "}
                  {new Date(hoveredPuja.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => {
                  setHoveredPuja(null);
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
              <p className="mt-2 text-gray-500">Loading pujas...</p>
            </div>
          ) : pujas.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                No {showActive ? "active" : "inactive"} pujas found
              </p>
              <button
                onClick={() => {
                  setActiveTab("form");
                  resetForm();
                }}
                className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
              >
                Add First Puja
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border min-w-[900px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      #
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Puja Name
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Temple
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Category
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Price
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Duration
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Slots
                    </th>
                    <th className="border p-2 text-xs md:text-sm font-semibold text-gray-700 text-left">
                      Start Time
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
                  {pujas.map((puja, index) => (
                    <tr
                      key={puja.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border p-2">
                        <div className="font-medium text-xs md:text-sm text-gray-800">
                          {puja.name}
                        </div>
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {getTempleName(puja.temple_id)}
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {getCategoryName(puja.puja_category_id)?.name}
                      </td>
                      <td className="border p-2">
                        <div className="font-bold text-xs md:text-sm text-orange-600">
                          ₹{puja.price}
                        </div>
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {formatDuration(puja.duration)}
                      </td>
                      <td className="border p-2">
                        <div className="font-bold text-xs md:text-sm text-blue-600">
                          {puja.slot}
                        </div>
                      </td>
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {formatTime(puja.start_time)}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() =>
                            handleStatusToggle(puja.id, puja.status)
                          }
                          className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-white text-xs md:text-sm font-medium transition-colors w-full ${puja.status === "active"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-500 hover:bg-gray-600"
                            }`}
                        >
                          {puja.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-wrap gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(puja)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm flex items-center gap-1 w-full justify-center"
                            title="Edit"
                          >
                            <FaEdit size={12} /> Edit
                          </button>
                          {/* <button
                            onClick={() => handleDelete(puja.id)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm flex items-center gap-1 w-full justify-center"
                            title="Delete"
                          >
                            Delete
                          </button> */}
                        </div>
                      </td>
                      <td className="border p-2 text-center">
                        <div
                          className="details-icon inline-flex items-center justify-center"
                          onMouseEnter={(e) => handleDetailsHover(puja, e)}
                          onMouseLeave={handleIconLeave}
                          onTouchStart={(e) => handleTouchStart(puja, e)}
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

export default AdminPuja;
