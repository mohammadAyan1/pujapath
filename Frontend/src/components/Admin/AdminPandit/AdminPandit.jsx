import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaPlus,
  FaStar,
  FaUserTie,
  FaLanguage,
  FaCalendarAlt,
  FaBuilding,
  FaInfoCircle,
  FaRupeeSign,
  FaPhoneAlt,
  FaComments,
  FaUserSlash,
  FaTimes,
} from "react-icons/fa";
import { GiAstronautHelmet } from "react-icons/gi";
import api from "../../../api/axios";

const AdminPandit = () => {
  const firstRun = useRef(true);

  const [activeTab, setActiveTab] = useState("form");
  const [showActive, setShowActive] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [hoveredPandit, setHoveredPandit] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipSide, setTooltipSide] = useState("right");
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  const [temples, setTemples] = useState([]);
  const [user, setUser] = useState([]);
  const [pandits, setPandits] = useState([]);

  const [loading, setLoading] = useState(false);
  const [templesLoading, setTemplesLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  // ✅ profile image
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // ✅ gallery images
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);

  // ✅ expertise list input
  const [expertiseInput, setExpertiseInput] = useState("");

  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    console.log(pandits);
  }, [pandits])

  const [formData, setFormData] = useState({
    name: "",
    expertise: "", // old single field (optional)
    expertise_list: [], // ✅ NEW MULTI
    about: "", // ✅ NEW ABOUT

    experience: "",
    language: "",
    rating: "",
    temple_id: "",
    user_id: "",
    type: "pandit",
    status: "active",

    is_free: 0,
    price_per_minute: "",

    communication: [], // ["call","chat","offline"]
  });

  /* ===============================
     HELPERS ✅
  =============================== */
  const parseJsonArray = (value) => {
    try {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return JSON.parse(value);
      return [];
    } catch {
      return [];
    }
  };

  /* ===============================
     FETCH ALL PANDITS ✅
  =============================== */
  const fetchAllPandits = async () => {
    try {
      setLoading(true);

      const endpoint = showActive
        ? "/pandit?status=active"
        : "/pandit?status=inactive";

      const res = await api.get(endpoint);

      if (res?.data?.success) {
        setPandits(res?.data?.data || []);
      } else {
        toast.error("Failed to fetch pandits");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch pandits");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     FETCH ALL TEMPLES ✅
  =============================== */
  const fetchAllTemples = async () => {
    try {
      setTemplesLoading(true);
      const res = await api.get("/temple?status=active");

      if (res?.data?.success) {
        setTemples(res?.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch temples:", error);
    } finally {
      setTemplesLoading(false);
    }
  };



  const fetchAllUser = async () => {
    try {
      setUserLoading(true);
      const res = await api.get("/user");
      if (res?.data?.success) {
        setUser(res?.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch temples:", error);
    } finally {
      setUserLoading(false);
    }

  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      fetchAllPandits();
      fetchAllTemples();
      fetchAllUser()
      return;
    }
    fetchAllPandits();
  }, [showActive]);

  /* ===============================
     TOOLTIP POSITION
  =============================== */
  const calculateTooltipPosition = (e) => {
    if (!e.target) return;

    const iconRect = e.target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipWidth = 320;
    const tooltipHeight = 320;

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

  const handleDetailsHover = (pandit, e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      calculateTooltipPosition(e);
      setHoveredPandit(pandit);
    }, 200);
  };

  const startLeaveTimeout = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredPandit(null);
      setIsTooltipHovered(false);
    }, 300);
  };

  const handleIconLeave = () => {
    if (!isTooltipHovered) startLeaveTimeout();
  };

  const handleTooltipEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    setIsTooltipHovered(true);
  };

  const handleTooltipLeave = () => {
    setIsTooltipHovered(false);
    startLeaveTimeout();
  };

  const handleTouchStart = (pandit, e) => {
    e.preventDefault();

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    if (hoveredPandit && hoveredPandit.id === pandit.id) {
      setHoveredPandit(null);
      setIsTooltipHovered(false);
    } else {
      calculateTooltipPosition(e);
      setHoveredPandit(pandit);
      setIsTooltipHovered(true);
    }
  };

  /* ===============================
     FORM HANDLERS
  =============================== */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ if FREE selected -> clear price
    if (name === "is_free") {
      const freeVal = Number(value) === 1 ? 1 : 0;
      setFormData((prev) => ({
        ...prev,
        is_free: freeVal,
        price_per_minute: freeVal === 1 ? "" : prev.price_per_minute,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ communication checkbox
  const handleCommunicationChange = (option) => {
    setFormData((prev) => {
      const exists = prev.communication.includes(option);
      return {
        ...prev,
        communication: exists
          ? prev.communication.filter((x) => x !== option)
          : [...prev.communication, option],
      };
    });
  };

  // ✅ add expertise chip
  const addExpertise = () => {
    const value = expertiseInput.trim();
    if (!value) return;

    setFormData((prev) => {
      if (prev.expertise_list.includes(value)) return prev;
      return { ...prev, expertise_list: [...prev.expertise_list, value] };
    });

    setExpertiseInput("");
  };

  // ✅ remove expertise chip
  const removeExpertise = (value) => {
    setFormData((prev) => ({
      ...prev,
      expertise_list: prev.expertise_list.filter((x) => x !== value),
    }));
  };

  // ✅ profile image
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ gallery images (multiple)
  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    for (let f of files) {
      if (!validTypes.includes(f.type)) {
        toast.error("Only JPEG/PNG/WebP allowed");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Each image must be < 5MB");
        return;
      }
    }

    setGalleryFiles(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreview(previews);
  };

  const removeGalleryImageByIndex = (idx) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== idx));
    setGalleryPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetGallery = () => {
    setGalleryFiles([]);
    setGalleryPreview([]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  /* ===============================
     SUBMIT FORM
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.experience ||
      !formData.language ||
      !formData.rating ||
      !formData.type
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // ✅ communication required
    if (!formData.communication || formData.communication.length === 0) {
      toast.error("Please select at least one Communication option");
      return;
    }

    // ✅ expertise_list required
    if (!formData.expertise_list || formData.expertise_list.length === 0) {
      toast.error("Please add at least one Expertise (skill)");
      return;
    }

    if (formData.rating < 0 || formData.rating > 5) {
      toast.error("Rating must be between 0 and 5");
      return;
    }

    if (formData.experience < 0) {
      toast.error("Experience must be a positive number");
      return;
    }

    // ✅ paid validation
    if (Number(formData.is_free) === 0) {
      const priceNum = Number(formData.price_per_minute);
      if (!priceNum || priceNum <= 0) {
        toast.error("Please enter valid Price Per Minute (₹)");
        return;
      }
    }

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("language", formData.language);
      formDataToSend.append("rating", formData.rating);
      formDataToSend.append("temple_id", formData.temple_id || "");
      formDataToSend.append("user_id", formData.user_id || "");
      formDataToSend.append("type", formData.type);

      formDataToSend.append("is_free", formData.is_free);
      formDataToSend.append("price_per_minute", formData.price_per_minute);

      // ✅ NEW
      formDataToSend.append("about", formData.about || "");

      // ✅ old optional single field
      formDataToSend.append("expertise", formData.expertise || "");

      // ✅ NEW arrays
      formDataToSend.append(
        "expertise_list",
        JSON.stringify(formData.expertise_list)
      );
      formDataToSend.append(
        "communication",
        JSON.stringify(formData.communication)
      );

      // ✅ profile image
      if (imageFile) formDataToSend.append("image", imageFile);

      // ✅ gallery images
      galleryFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      let res;

      if (isEditMode && editingId) {
        res = await api.put(`/pandit/${editingId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res?.data?.success) {
          toast.success("Pandit updated successfully");
          resetForm();
          fetchAllPandits();
          setActiveTab("table");
        }
      } else {
        res = await api.post("/pandit", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res?.data?.success) {
          toast.success("Pandit created successfully");
          resetForm();
          fetchAllPandits();
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      expertise: "",
      expertise_list: [],
      about: "",
      experience: "",
      language: "",
      rating: "",
      temple_id: "",
      user_id: "",
      type: "pandit",
      status: "active",
      is_free: 0,
      price_per_minute: "",
      communication: [],
    });

    setExpertiseInput("");

    setImageFile(null);
    setImagePreview(null);

    resetGallery();

    setIsEditMode(false);
    setEditingId(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (pandit) => {
    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(pandit.id);

    const comm = parseJsonArray(pandit.communication);
    const expList = parseJsonArray(pandit.expertise_list);
    const images = parseJsonArray(pandit.images);

    setFormData({
      name: pandit.name || "",
      expertise: pandit.expertise || "",
      expertise_list: expList,
      about: pandit.about || "",
      experience: pandit.experience || "",
      language: pandit.language || "",
      rating: pandit.rating || "",
      temple_id: pandit.temple_id || "",
      user_id: pandit.user_id || "",
      type: pandit.type || "pandit",
      status: pandit.status || "active",
      is_free: pandit.is_free ?? 0,
      price_per_minute: pandit.price_per_minute ?? "",
      communication: comm,
    });

    // profile image preview
    if (pandit.image) {
      // setImagePreview(`${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image}`);
      setImagePreview(`${import.meta.env.VITE_BACKEND_FOR_URL}${pandit.image}`);

    } else {
      setImagePreview(null);
    }

    // ✅ show already saved gallery images as preview (readonly)
    setGalleryFiles([]); // no new uploads yet
    setGalleryPreview(
      // images.map((img) => `${import.meta.env.VITE_BACKEND_FOR_URL}/${img}`)
      images.map((img) => `${import.meta.env.VITE_BACKEND_FOR_URL}${img}`)
    );

    setImageFile(null);
  };

  /* ===============================
     STATUS TOGGLE ✅
  =============================== */
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await api.patch(`/pandit/${id}/status`, {
        status: newStatus,
      });

      if (res?.data?.success) {
        toast.success(
          `Pandit ${newStatus === "active" ? "activated" : "deactivated"}`
        );
        fetchAllPandits();
      } else {
        toast.error(res?.data?.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const getTempleName = (templeId) => {
    const temple = temples.find((t) => t.id == templeId);
    return temple ? temple.name : "Not Assigned";
  };

  const formatExperience = (years) => {
    if (!years) return "0 years";
    return `${years} year${years > 1 ? "s" : ""}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-500 text-sm" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300 text-sm" />);
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCommunication = (comm) => {
    const arr = parseJsonArray(comm);
    if (!arr.length) return "N/A";
    return arr.map((x) => x.toUpperCase()).join(", ");
  };

  const formatExpertiseList = (exp) => {
    const arr = parseJsonArray(exp);
    if (!arr.length) return "N/A";
    return arr.join(", ");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        !e.target.closest(".details-icon")
      ) {
        setHoveredPandit(null);
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
          {isEditMode ? "Edit Pandit" : "Add Pandit"}
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "table"
            ? "border-b-2 border-orange-600 text-orange-600"
            : "text-gray-500"
            }`}
        >
          Pandit List
        </button>
      </div>

      {/* FORM */}
      {activeTab === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold">
              {isEditMode ? "Edit Pandit" : "Add New Pandit"}
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
            {/* Left */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter pandit name"
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="pandit"
                      checked={formData.type === "pandit"}
                      onChange={handleChange}
                    />
                    <FaUserTie className="text-orange-500" />
                    <span>Pandit</span>
                  </label>

                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value="astro"
                      checked={formData.type === "astro"}
                      onChange={handleChange}
                    />
                    <GiAstronautHelmet className="text-purple-500" />
                    <span>Astrologer</span>
                  </label>
                </div>
              </div>

              {/* Experience + Rating */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (years) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min="0"
                      required
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (0-5) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaStar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      min="0"
                      max="5"
                      step="0.1"
                      required
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {formData.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(parseFloat(formData.rating))}
                      <span className="text-xs text-gray-600 ml-1">
                        ({formData.rating})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaLanguage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    placeholder="e.g., Hindi, English"
                    required
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* ✅ About */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About (Introduction)
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Write about pandit/astro..."
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* ✅ Multi Expertise Chips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expertise (Skills) <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  <input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="Enter skill & press Add"
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addExpertise}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Add
                  </button>
                </div>

                {formData.expertise_list.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.expertise_list.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700 font-semibold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeExpertise(skill)}
                          className="text-orange-700 hover:text-red-600"
                        >
                          <FaTimes />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ Communication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.communication.includes("call")}
                      onChange={() => handleCommunicationChange("call")}
                    />
                    <FaPhoneAlt className="text-green-600" />
                    <span>Call</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.communication.includes("chat")}
                      onChange={() => handleCommunicationChange("chat")}
                    />
                    <FaComments className="text-blue-600" />
                    <span>Chat</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.communication.includes("offline")}
                      onChange={() => handleCommunicationChange("offline")}
                    />
                    <FaUserSlash className="text-gray-600" />
                    <span>Offline</span>
                  </label>
                </div>
              </div>

              {/* ✅ Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Type <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="is_free"
                      value="1"
                      checked={Number(formData.is_free) === 1}
                      onChange={handleChange}
                    />
                    <span className="font-semibold text-green-700">FREE</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="is_free"
                      value="0"
                      checked={Number(formData.is_free) === 0}
                      onChange={handleChange}
                    />
                    <span className="font-semibold text-orange-700">
                      Per Minute
                    </span>
                  </label>
                </div>

                {Number(formData.is_free) === 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Per Minute (₹){" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="price_per_minute"
                        value={formData.price_per_minute}
                        onChange={handleChange}
                        placeholder="Enter price per minute"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              {/* Temple */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temple (Optional)
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    name="temple_id"
                    value={formData.temple_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={templesLoading}
                  >
                    <option value="">Select Temple (Optional)</option>
                    {temples.map((temple) => (
                      <option key={temple.id} value={temple.id}>
                        {temple.name} - {temple.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


              {/* pandit user id */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={templesLoading}
                    required
                  >
                    <option value="">Select User</option>
                    {user.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image
                </label>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <div className="w-32 h-32 rounded-lg overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Images (Multiple)
                </label>

                <div className="space-y-3">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />

                  {galleryPreview.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Gallery Preview:</p>
                        <button
                          type="button"
                          onClick={resetGallery}
                          className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {galleryPreview.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-full h-24 border rounded overflow-hidden"
                          >
                            <img
                              src={img}
                              alt={`gallery-${idx}`}
                              className="w-full h-full object-cover"
                            />

                            {/* ✅ Remove preview if it is newly uploaded */}
                            <button
                              type="button"
                              onClick={() => removeGalleryImageByIndex(idx)}
                              className="absolute top-1 right-1 bg-white text-red-600 rounded-full p-1 shadow"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 md:gap-4 pt-4 border-t">
            <button
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm md:text-base font-medium flex items-center gap-2"
            >
              {isEditMode ? (
                <>
                  <FaEdit /> Update Pandit
                </>
              ) : (
                <>
                  <FaPlus /> Add Pandit
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

      {/* TABLE */}
      {activeTab === "table" && (
        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold">Pandit List</h2>

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
          {hoveredPandit && (
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
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    {hoveredPandit.image ? (
                      <img
                        // src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${hoveredPandit.image
                        //   }`}

                        src={`${import.meta.env.VITE_BACKEND_FOR_URL}${hoveredPandit.image
                          }`}
                        alt={hoveredPandit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <FaUserTie className="text-gray-400 text-2xl" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base md:text-lg text-gray-800">
                      {hoveredPandit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {hoveredPandit.type === "astro" ? (
                        <GiAstronautHelmet className="text-purple-500" />
                      ) : (
                        <FaUserTie className="text-orange-500" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">
                        {hoveredPandit.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-700">Temple:</span>
                    <p className="text-gray-800">
                      {getTempleName(hoveredPandit.temple_id)}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Rating:</span>
                    <div className="flex items-center gap-1">
                      {renderStars(hoveredPandit.rating)}
                      <span className="text-gray-800 ml-1">
                        ({hoveredPandit.rating}/5)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">
                    Expertise (List):
                  </span>
                  <p className="text-gray-800">
                    {formatExpertiseList(hoveredPandit.expertise_list)}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Languages:</span>
                  <p className="text-gray-800">{hoveredPandit.language}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-medium text-gray-700">
                      Experience:
                    </span>
                    <p className="text-gray-800">
                      {formatExperience(hoveredPandit.experience)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Availability:
                    </span>
                    <p className="text-gray-800">
                      {hoveredPandit.is_available ? "Available" : "Busy"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <span className="font-medium text-gray-700">
                    Communication:
                  </span>
                  <p className="text-gray-800">
                    {formatCommunication(hoveredPandit.communication)}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <span className="font-medium text-gray-700">Pricing:</span>
                  <p className="text-gray-800">
                    {hoveredPandit.is_free == 1
                      ? "FREE"
                      : `₹${hoveredPandit.price_per_minute}/min`}
                  </p>
                </div>

                {hoveredPandit.about && (
                  <div className="pt-2 border-t">
                    <span className="font-medium text-gray-700">About:</span>
                    <p className="text-gray-800">{hoveredPandit.about}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${hoveredPandit.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {hoveredPandit.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created: {formatDate(hoveredPandit.created_at)}
                </div>
              </div>

              <button
                onClick={() => {
                  setHoveredPandit(null);
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
              <p className="mt-2 text-gray-500">Loading pandits...</p>
            </div>
          ) : pandits.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                No {showActive ? "active" : "inactive"} pandits found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full border min-w-[1300px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm">#</th>
                    <th className="border p-2 text-xs md:text-sm">Image</th>
                    <th className="border p-2 text-xs md:text-sm">Name</th>
                    <th className="border p-2 text-xs md:text-sm">Type</th>
                    <th className="border p-2 text-xs md:text-sm">Temple</th>
                    {/* <th className="border p-2 text-xs md:text-sm">Expertise</th> */}
                    <th className="border p-2 text-xs md:text-sm">Experience</th>
                    <th className="border p-2 text-xs md:text-sm">Languages</th>
                    <th className="border p-2 text-xs md:text-sm">Rating</th>
                    <th className="border p-2 text-xs md:text-sm">
                      Expertise List
                    </th>
                    <th className="border p-2 text-xs md:text-sm">
                      Communication
                    </th>
                    <th className="border p-2 text-xs md:text-sm">Pricing</th>
                    <th className="border p-2 text-xs md:text-sm">Status</th>
                    <th className="border p-2 text-xs md:text-sm">Actions</th>
                    <th className="border p-2 text-xs md:text-sm">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {pandits.map((pandit, index) => (
                    <tr
                      key={pandit.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border p-2 text-xs md:text-sm text-gray-600">
                        {index + 1}
                      </td>

                      <td className="border p-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          {pandit.image ? (
                            <img
                              // src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image
                              //   }`}

                              src={`${import.meta.env.VITE_BACKEND_FOR_URL}${pandit.image
                                }`}
                              alt={pandit.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <FaUserTie className="text-gray-400 text-xl" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="border p-2 text-xs md:text-sm font-medium">
                        {pandit.name}
                      </td>

                      <td className="border p-2 text-xs md:text-sm capitalize">
                        {pandit.type}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {getTempleName(pandit.temple_id)}
                      </td>

                      {/* <td className="border p-2 text-xs md:text-sm">
                        {pandit.expertise || "-"}
                      </td> */}

                      <td className="border p-2 text-xs md:text-sm">
                        {formatExperience(pandit.experience)}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {pandit.language}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {pandit.rating}/5
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {formatExpertiseList(pandit.expertise_list)}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {formatCommunication(pandit.communication)}
                      </td>

                      <td className="border p-2 text-xs md:text-sm font-semibold">
                        {pandit.is_free == 1 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <span className="text-orange-600">
                            ₹{pandit.price_per_minute}/min
                          </span>
                        )}
                      </td>

                      <td className="border p-2">
                        <button
                          onClick={() =>
                            handleStatusToggle(pandit.id, pandit.status)
                          }
                          className={`px-3 py-1 rounded-lg text-white text-xs md:text-sm font-medium w-full ${pandit.status === "active"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-500 hover:bg-gray-600"
                            }`}
                        >
                          {pandit.status}
                        </button>
                      </td>

                      <td className="border p-2">
                        <button
                          onClick={() => handleEdit(pandit)}
                          className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm w-full flex justify-center items-center gap-1"
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                      </td>

                      <td className="border p-2 text-center">
                        <div
                          className="details-icon inline-flex items-center justify-center"
                          onMouseEnter={(e) => handleDetailsHover(pandit, e)}
                          onMouseLeave={handleIconLeave}
                          onTouchStart={(e) => handleTouchStart(pandit, e)}
                        >
                          <FaInfoCircle className="text-blue-500 text-lg md:text-xl cursor-pointer hover:text-blue-700 transition-colors" />
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

export default AdminPandit;
