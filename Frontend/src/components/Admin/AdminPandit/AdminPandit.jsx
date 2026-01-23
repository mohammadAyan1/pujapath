// import React, { useEffect, useState, useRef } from "react";
// import { toast } from "react-toastify";
// import {
//   FaEdit,
//   FaPlus,
//   FaStar,
//   FaUserTie,
//   FaLanguage,
//   FaCalendarAlt,
//   FaBuilding,
//   FaInfoCircle,
// } from "react-icons/fa";
// import { GiAstronautHelmet } from "react-icons/gi";
// import api from "../../../api/axios";

// const AdminPandit = () => {
//   const firstRun = useRef(true);

//   const [activeTab, setActiveTab] = useState("form");
//   const [showActive, setShowActive] = useState(true);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [hoveredPandit, setHoveredPandit] = useState(null);
//   const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
//   const [tooltipSide, setTooltipSide] = useState("right");
//   const [isTooltipHovered, setIsTooltipHovered] = useState(false);

//   const [temples, setTemples] = useState([]);
//   const [pandits, setPandits] = useState([]);

//   const [loading, setLoading] = useState(false);
//   const [templesLoading, setTemplesLoading] = useState(false);

//   const [imagePreview, setImagePreview] = useState(null);
//   const [imageFile, setImageFile] = useState(null);

//   const hoverTimeoutRef = useRef(null);
//   const leaveTimeoutRef = useRef(null);
//   const tooltipRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     expertise: "",
//     experience: "",
//     language: "",
//     rating: "",
//     temple_id: "",
//     type: "pandit",
//     status: "active",
//   });

//   /* ===============================
//      FETCH ALL PANDITS ✅ (FILTER BY ACTIVE/INACTIVE SAME AS CATEGORY)
//   =============================== */
//   const fetchAllPandits = async () => {
//     try {
//       setLoading(true);

//       const endpoint = showActive
//         ? "/pandit?status=active"
//         : "/pandit?status=inactive";

//       const res = await api.get(endpoint);

//       if (res?.data?.success) {
//         setPandits(res?.data?.data || []);
//       } else {
//         toast.error("Failed to fetch pandits");
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to fetch pandits");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ===============================
//      FETCH ALL TEMPLES ✅
//      (ONLY ACTIVE TEMPLES FOR DROPDOWN)
//   =============================== */
//   const fetchAllTemples = async () => {
//     try {
//       setTemplesLoading(true);
//       const res = await api.get("/temple?status=active");

//       if (res?.data?.success) {
//         setTemples(res?.data?.data || []);
//       }
//     } catch (error) {
//       console.error("Failed to fetch temples:", error);
//     } finally {
//       setTemplesLoading(false);
//     }
//   };

//   /* ✅ RUN FETCH WHEN ACTIVE/INACTIVE CHANGES */
//   useEffect(() => {
//     if (firstRun.current) {
//       firstRun.current = false;
//       fetchAllPandits();
//       fetchAllTemples();
//       return;
//     }

//     fetchAllPandits();
//   }, [showActive]);

//   /* ===============================
//      TOOLTIP POSITION
//   =============================== */
//   const calculateTooltipPosition = (e) => {
//     if (!e.target) return;

//     const iconRect = e.target.getBoundingClientRect();
//     const viewportWidth = window.innerWidth;
//     const viewportHeight = window.innerHeight;

//     const tooltipWidth = 320;
//     const tooltipHeight = 300;

//     const spaceOnRight = viewportWidth - iconRect.right;
//     const spaceOnLeft = iconRect.left;
//     const spaceOnBottom = viewportHeight - iconRect.bottom;
//     const spaceOnTop = iconRect.top;

//     let x, y;
//     let side = "right";

//     if (spaceOnRight >= tooltipWidth || spaceOnRight > spaceOnLeft) {
//       side = "right";
//       x = iconRect.right + 10;
//     } else {
//       side = "left";
//       x = iconRect.left - tooltipWidth - 10;
//     }

//     if (spaceOnBottom >= tooltipHeight || spaceOnBottom > spaceOnTop) {
//       y = iconRect.top;
//     } else {
//       y = iconRect.top - tooltipHeight + iconRect.height;
//     }

//     x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10));
//     y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10));

//     setTooltipPosition({ x, y });
//     setTooltipSide(side);
//   };

//   const handleDetailsHover = (pandit, e) => {
//     if (leaveTimeoutRef.current) {
//       clearTimeout(leaveTimeoutRef.current);
//       leaveTimeoutRef.current = null;
//     }

//     if (hoverTimeoutRef.current) {
//       clearTimeout(hoverTimeoutRef.current);
//     }

//     hoverTimeoutRef.current = setTimeout(() => {
//       calculateTooltipPosition(e);
//       setHoveredPandit(pandit);
//     }, 200);
//   };

//   const startLeaveTimeout = () => {
//     if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

//     leaveTimeoutRef.current = setTimeout(() => {
//       setHoveredPandit(null);
//       setIsTooltipHovered(false);
//     }, 300);
//   };

//   const handleIconLeave = () => {
//     if (!isTooltipHovered) startLeaveTimeout();
//   };

//   const handleTooltipEnter = () => {
//     if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
//     setIsTooltipHovered(true);
//   };

//   const handleTooltipLeave = () => {
//     setIsTooltipHovered(false);
//     startLeaveTimeout();
//   };

//   const handleTouchStart = (pandit, e) => {
//     e.preventDefault();

//     if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
//     if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

//     if (hoveredPandit && hoveredPandit.id === pandit.id) {
//       setHoveredPandit(null);
//       setIsTooltipHovered(false);
//     } else {
//       calculateTooltipPosition(e);
//       setHoveredPandit(pandit);
//       setIsTooltipHovered(true);
//     }
//   };

//   /* ===============================
//      FORM HANDLERS
//   =============================== */
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
//     if (!validTypes.includes(file.type)) {
//       toast.error("Please select a valid image file (JPEG, PNG, WebP)");
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image size should be less than 5MB");
//       return;
//     }

//     setImageFile(file);

//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result);
//     reader.readAsDataURL(file);
//   };

//   const handleRemoveImage = () => {
//     setImageFile(null);
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   /* ===============================
//      SUBMIT FORM
//   =============================== */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !formData.name ||
//       !formData.expertise ||
//       !formData.experience ||
//       !formData.language ||
//       !formData.rating ||
//       !formData.type
//     ) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     if (formData.rating < 0 || formData.rating > 5) {
//       toast.error("Rating must be between 0 and 5");
//       return;
//     }

//     if (formData.experience < 0) {
//       toast.error("Experience must be a positive number");
//       return;
//     }

//     try {
//       const formDataToSend = new FormData();

//       Object.keys(formData).forEach((key) => {
//         formDataToSend.append(key, formData[key]);
//       });

//       if (imageFile) formDataToSend.append("image", imageFile);

//       let res;
//       if (isEditMode && editingId) {
//         res = await api.put(`/pandit/${editingId}`, formDataToSend, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });

//         if (res?.data?.success) {
//           toast.success("Pandit updated successfully");
//           resetForm();
//           fetchAllPandits();
//           setActiveTab("table");
//         }
//       } else {
//         res = await api.post("/pandit", formDataToSend, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });

//         if (res?.data?.success) {
//           toast.success("Pandit created successfully");
//           resetForm();
//           fetchAllPandits();
//         }
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "An error occurred");
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       expertise: "",
//       experience: "",
//       language: "",
//       rating: "",
//       temple_id: "",
//       type: "pandit",
//       status: "active",
//     });

//     setImageFile(null);
//     setImagePreview(null);
//     setIsEditMode(false);
//     setEditingId(null);

//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleEdit = (pandit) => {
//     setActiveTab("form");
//     setIsEditMode(true);
//     setEditingId(pandit.id);

//     setFormData({
//       name: pandit.name || "",
//       expertise: pandit.expertise || "",
//       experience: pandit.experience || "",
//       language: pandit.language || "",
//       rating: pandit.rating || "",
//       temple_id: pandit.temple_id || "",
//       type: pandit.type || "pandit",
//       status: pandit.status || "active",
//     });

//     if (pandit.image) {
//       setImagePreview(
//         `${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image}`
//       );
//     } else {
//       setImagePreview(null);
//     }

//     setImageFile(null);
//   };

//   /* ===============================
//      STATUS TOGGLE ✅ (USE YOUR PATCH API)
//   =============================== */
//   const handleStatusToggle = async (id, currentStatus) => {
//     try {
//       const newStatus = currentStatus === "active" ? "inactive" : "active";

//       const res = await api.patch(`/pandit/${id}/status`, {
//         status: newStatus,
//       });

//       if (res?.data?.success) {
//         toast.success(
//           `Pandit ${newStatus === "active" ? "activated" : "deactivated"}`
//         );
//         fetchAllPandits();
//       } else {
//         toast.error(res?.data?.message || "Failed to update status");
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to update status");
//     }
//   };

//   const getTempleName = (templeId) => {
//     const temple = temples.find((t) => t.id == templeId);
//     return temple ? temple.name : "Not Assigned";
//   };

//   const formatExperience = (years) => {
//     if (!years) return "0 years";
//     return `${years} year${years > 1 ? "s" : ""}`;
//   };

//   const renderStars = (rating) => {
//     const stars = [];
//     const fullStars = Math.floor(rating);

//     for (let i = 0; i < fullStars; i++) {
//       stars.push(
//         <FaStar key={i} className="text-yellow-500 text-sm md:text-base" />
//       );
//     }

//     const emptyStars = 5 - stars.length;
//     for (let i = 0; i < emptyStars; i++) {
//       stars.push(
//         <FaStar
//           key={`empty-${i}`}
//           className="text-gray-300 text-sm md:text-base"
//         />
//       );
//     }
//     return stars;
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString();
//   };

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         tooltipRef.current &&
//         !tooltipRef.current.contains(e.target) &&
//         !e.target.closest(".details-icon")
//       ) {
//         setHoveredPandit(null);
//         setIsTooltipHovered(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("touchstart", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("touchstart", handleClickOutside);

//       if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
//       if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
//     };
//   }, []);

//   return (
//     <div className="max-w-6xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow">
//       {/* TABS */}
//       <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b pb-2 overflow-x-auto">
//         <button
//           onClick={() => {
//             setActiveTab("form");
//             resetForm();
//           }}
//           className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "form"
//             ? "border-b-2 border-orange-600 text-orange-600"
//             : "text-gray-500"
//             }`}
//         >
//           {isEditMode ? "Edit Pandit" : "Add Pandit"}
//         </button>

//         <button
//           onClick={() => setActiveTab("table")}
//           className={`px-3 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === "table"
//             ? "border-b-2 border-orange-600 text-orange-600"
//             : "text-gray-500"
//             }`}
//         >
//           Pandit List
//         </button>
//       </div>

//       {/* FORM */}
//       {activeTab === "form" && (
//         <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
//           <div className="flex justify-between items-center">
//             <h2 className="text-lg md:text-xl font-bold">
//               {isEditMode ? "Edit Pandit" : "Add New Pandit"}
//             </h2>

//             {isEditMode && (
//               <button
//                 type="button"
//                 onClick={resetForm}
//                 className="px-3 py-1 md:px-4 md:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Cancel Edit
//               </button>
//             )}
//           </div>

//           {/* Form fields (same as your current UI) */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//             {/* Left */}
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Name <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     placeholder="Enter pandit name"
//                     required
//                     className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Type <span className="text-red-500">*</span>
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">
//                   <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
//                     <input
//                       type="radio"
//                       name="type"
//                       value="pandit"
//                       checked={formData.type === "pandit"}
//                       onChange={handleChange}
//                       className="text-orange-600"
//                     />
//                     <FaUserTie className="text-orange-500" />
//                     <span>Pandit</span>
//                   </label>
//                   <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
//                     <input
//                       type="radio"
//                       name="type"
//                       value="astro"
//                       checked={formData.type === "astro"}
//                       onChange={handleChange}
//                       className="text-orange-600"
//                     />
//                     <GiAstronautHelmet className="text-purple-500" />
//                     <span>Astrologer</span>
//                   </label>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Expertise <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="expertise"
//                   value={formData.expertise}
//                   onChange={handleChange}
//                   placeholder="e.g., Vedic Rituals, Horoscope Reading"
//                   required
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Experience (years) <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="experience"
//                       value={formData.experience}
//                       onChange={handleChange}
//                       placeholder="Years"
//                       min="0"
//                       max="100"
//                       required
//                       className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Rating (0-5) <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <FaStar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="rating"
//                       value={formData.rating}
//                       onChange={handleChange}
//                       placeholder="0.0 - 5.0"
//                       min="0"
//                       max="5"
//                       step="0.1"
//                       required
//                       className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                   </div>
//                   {formData.rating && (
//                     <div className="flex items-center gap-1 mt-1">
//                       {renderStars(parseFloat(formData.rating))}
//                       <span className="text-xs text-gray-600 ml-1">
//                         ({formData.rating})
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Right */}
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Temple (Optional)
//                 </label>
//                 <div className="relative">
//                   <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <select
//                     name="temple_id"
//                     value={formData.temple_id}
//                     onChange={handleChange}
//                     className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     disabled={templesLoading}
//                   >
//                     <option value="">Select Temple (Optional)</option>
//                     {temples.map((temple) => (
//                       <option key={temple.id} value={temple.id}>
//                         {temple.name} - {temple.city}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Languages <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <FaLanguage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                   <input
//                     type="text"
//                     name="language"
//                     value={formData.language}
//                     onChange={handleChange}
//                     placeholder="e.g., Hindi, English, Sanskrit"
//                     required
//                     className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Profile Image
//                 </label>

//                 <div className="space-y-3">
//                   <div className="flex items-center gap-3">
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//                     />
//                     {imagePreview && (
//                       <button
//                         type="button"
//                         onClick={handleRemoveImage}
//                         className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>

//                   {imagePreview && (
//                     <div className="mt-2">
//                       <p className="text-sm text-gray-600 mb-2">Preview:</p>
//                       <div className="w-32 h-32 rounded-lg overflow-hidden border">
//                         <img
//                           src={imagePreview}
//                           alt="Preview"
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-3 md:gap-4 pt-4 border-t">
//             <button
//               type="submit"
//               className="bg-orange-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm md:text-base font-medium flex items-center gap-2"
//             >
//               {isEditMode ? (
//                 <>
//                   <FaEdit /> Update Pandit
//                 </>
//               ) : (
//                 <>
//                   <FaPlus /> Add Pandit
//                 </>
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={resetForm}
//               className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
//             >
//               Reset Form
//             </button>
//           </div>
//         </form>
//       )}

//       {/* TABLE */}
//       {activeTab === "table" && (
//         <div>
//           <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
//             <h2 className="text-lg md:text-xl font-bold">Pandit List</h2>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowActive(!showActive)}
//                 className={`px-4 py-2 border rounded-lg transition-colors text-sm md:text-base font-medium ${showActive
//                   ? "bg-green-600 text-white hover:bg-green-700"
//                   : "bg-gray-600 text-white hover:bg-gray-700"
//                   }`}
//               >
//                 Showing: {showActive ? "Active" : "Inactive"}
//               </button>

//               <button
//                 onClick={() => {
//                   setActiveTab("form");
//                   resetForm();
//                 }}
//                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
//               >
//                 <FaPlus /> Add New
//               </button>
//             </div>
//           </div>

//           {/* DETAILS TOOLTIP */}
//           {hoveredPandit && (
//             <div
//               ref={tooltipRef}
//               className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 md:p-4 w-[280px] md:w-96 max-h-[80vh] overflow-y-auto ${tooltipSide === "right" ? "ml-2" : "mr-2"
//                 }`}
//               style={{
//                 left: `${tooltipPosition.x}px`,
//                 top: `${tooltipPosition.y}px`,
//                 pointerEvents: "auto",
//               }}
//               onMouseEnter={handleTooltipEnter}
//               onMouseLeave={handleTooltipLeave}
//             >
//               <div className="mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-16 h-16 rounded-full overflow-hidden">
//                     {hoveredPandit.image ? (
//                       <img
//                         src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${hoveredPandit.image}`}
//                         alt={hoveredPandit.name}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <div className="w-full h-full bg-gray-200 flex items-center justify-center">
//                         <FaUserTie className="text-gray-400 text-2xl" />
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-base md:text-lg text-gray-800">
//                       {hoveredPandit.name}
//                     </h3>
//                     <div className="flex items-center gap-2 mt-1">
//                       {hoveredPandit.type === "astro" ? (
//                         <GiAstronautHelmet className="text-purple-500" />
//                       ) : (
//                         <FaUserTie className="text-orange-500" />
//                       )}
//                       <span className="text-sm text-gray-600 capitalize">
//                         {hoveredPandit.type}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3 text-xs md:text-sm">
//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <span className="font-medium text-gray-700">Temple:</span>
//                     <p className="text-gray-800">
//                       {getTempleName(hoveredPandit.temple_id)}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-gray-700">Rating:</span>
//                     <div className="flex items-center gap-1">
//                       {renderStars(hoveredPandit.rating)}
//                       <span className="text-gray-800 ml-1">
//                         ({hoveredPandit.rating}/5)
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <span className="font-medium text-gray-700">Expertise:</span>
//                   <p className="text-gray-800">{hoveredPandit.expertise}</p>
//                 </div>

//                 <div>
//                   <span className="font-medium text-gray-700">Languages:</span>
//                   <p className="text-gray-800">{hoveredPandit.language}</p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <span className="font-medium text-gray-700">
//                       Experience:
//                     </span>
//                     <p className="text-gray-800">
//                       {formatExperience(hoveredPandit.experience)}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="font-medium text-gray-700">
//                       Availability:
//                     </span>
//                     <p className="text-gray-800">
//                       {hoveredPandit.is_available ? "Available" : "Busy"}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex justify-between items-center pt-2 border-t">
//                   <span className="font-medium text-gray-700">Status:</span>
//                   <span
//                     className={`px-2 py-1 rounded text-xs font-medium ${hoveredPandit.status === "active"
//                       ? "bg-green-100 text-green-800"
//                       : "bg-gray-100 text-gray-800"
//                       }`}
//                   >
//                     {hoveredPandit.status}
//                   </span>
//                 </div>

//                 <div className="text-xs text-gray-500 pt-2 border-t">
//                   Created: {formatDate(hoveredPandit.created_at)}
//                 </div>
//               </div>

//               <button
//                 onClick={() => {
//                   setHoveredPandit(null);
//                   setIsTooltipHovered(false);
//                 }}
//                 className="md:hidden mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
//               >
//                 Close
//               </button>
//             </div>
//           )}

//           {loading ? (
//             <div className="text-center py-8">
//               <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
//               <p className="mt-2 text-gray-500">Loading pandits...</p>
//             </div>
//           ) : pandits.length === 0 ? (
//             <div className="text-center py-8 border rounded-lg bg-gray-50">
//               <p className="text-gray-500">
//                 No {showActive ? "active" : "inactive"} pandits found
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto -mx-4 md:mx-0">
//               <table className="w-full border min-w-[1000px] md:min-w-0">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="border p-2 text-xs md:text-sm">#</th>
//                     <th className="border p-2 text-xs md:text-sm">Image</th>
//                     <th className="border p-2 text-xs md:text-sm">Name</th>
//                     <th className="border p-2 text-xs md:text-sm">Type</th>
//                     <th className="border p-2 text-xs md:text-sm">Temple</th>
//                     <th className="border p-2 text-xs md:text-sm">Expertise</th>
//                     <th className="border p-2 text-xs md:text-sm">Experience</th>
//                     <th className="border p-2 text-xs md:text-sm">Languages</th>
//                     <th className="border p-2 text-xs md:text-sm">Rating</th>
//                     <th className="border p-2 text-xs md:text-sm">Status</th>
//                     <th className="border p-2 text-xs md:text-sm">Actions</th>
//                     <th className="border p-2 text-xs md:text-sm">Details</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {pandits.map((pandit, index) => (
//                     <tr
//                       key={pandit.id}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="border p-2 text-xs md:text-sm text-gray-600">
//                         {index + 1}
//                       </td>

//                       <td className="border p-2">
//                         <div className="w-12 h-12 rounded-full overflow-hidden">
//                           {pandit.image ? (
//                             <img
//                               src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image}`}
//                               alt={pandit.name}
//                               className="w-full h-full object-cover"
//                             />
//                           ) : (
//                             <div className="w-full h-full bg-gray-200 flex items-center justify-center">
//                               <FaUserTie className="text-gray-400 text-xl" />
//                             </div>
//                           )}
//                         </div>
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm font-medium">
//                         {pandit.name}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm capitalize">
//                         {pandit.type}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm">
//                         {getTempleName(pandit.temple_id)}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm">
//                         {pandit.expertise}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm">
//                         {formatExperience(pandit.experience)}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm">
//                         {pandit.language}
//                       </td>

//                       <td className="border p-2 text-xs md:text-sm">
//                         {pandit.rating}/5
//                       </td>

//                       <td className="border p-2">
//                         <button
//                           onClick={() =>
//                             handleStatusToggle(pandit.id, pandit.status)
//                           }
//                           className={`px-3 py-1 rounded-lg text-white text-xs md:text-sm font-medium w-full ${pandit.status === "active"
//                             ? "bg-green-600 hover:bg-green-700"
//                             : "bg-gray-500 hover:bg-gray-600"
//                             }`}
//                         >
//                           {pandit.status}
//                         </button>
//                       </td>

//                       <td className="border p-2">
//                         <button
//                           onClick={() => handleEdit(pandit)}
//                           className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm w-full flex justify-center items-center gap-1"
//                         >
//                           <FaEdit size={12} /> Edit
//                         </button>
//                       </td>

//                       <td className="border p-2 text-center">
//                         <div
//                           className="details-icon inline-flex items-center justify-center"
//                           onMouseEnter={(e) => handleDetailsHover(pandit, e)}
//                           onMouseLeave={handleIconLeave}
//                           onTouchStart={(e) => handleTouchStart(pandit, e)}
//                         >
//                           <FaInfoCircle className="text-blue-500 text-lg md:text-xl cursor-pointer hover:text-blue-700 transition-colors" />
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminPandit;



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
  const [pandits, setPandits] = useState([]);

  const [loading, setLoading] = useState(false);
  const [templesLoading, setTemplesLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    expertise: "",
    experience: "",
    language: "",
    rating: "",
    temple_id: "",
    type: "pandit",
    status: "active",

    // ✅ NEW
    is_free: 0,
    price_per_minute: "",
  });

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

  /* ✅ RUN FETCH WHEN ACTIVE/INACTIVE CHANGES */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      fetchAllPandits();
      fetchAllTemples();
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

  const handleDetailsHover = (pandit, e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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

  /* ===============================
     SUBMIT FORM
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.expertise ||
      !formData.experience ||
      !formData.language ||
      !formData.rating ||
      !formData.type
    ) {
      toast.error("Please fill all required fields");
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

    // ✅ NEW PRICE VALIDATION
    if (Number(formData.is_free) === 0) {
      const priceNum = Number(formData.price_per_minute);
      if (!priceNum || priceNum <= 0) {
        toast.error("Please enter valid Price Per Minute (₹)");
        return;
      }
    }

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      if (imageFile) formDataToSend.append("image", imageFile);

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
      experience: "",
      language: "",
      rating: "",
      temple_id: "",
      type: "pandit",
      status: "active",

      // ✅ NEW
      is_free: 0,
      price_per_minute: "",
    });

    setImageFile(null);
    setImagePreview(null);
    setIsEditMode(false);
    setEditingId(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (pandit) => {
    setActiveTab("form");
    setIsEditMode(true);
    setEditingId(pandit.id);

    setFormData({
      name: pandit.name || "",
      expertise: pandit.expertise || "",
      experience: pandit.experience || "",
      language: pandit.language || "",
      rating: pandit.rating || "",
      temple_id: pandit.temple_id || "",
      type: pandit.type || "pandit",
      status: pandit.status || "active",

      // ✅ NEW
      is_free: pandit.is_free ?? 0,
      price_per_minute: pandit.price_per_minute ?? "",
    });

    if (pandit.image) {
      setImagePreview(`${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image}`);
    } else {
      setImagePreview(null);
    }

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
    const fullStars = Math.floor(rating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-500 text-sm" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaStar
          key={`empty-${i}`}
          className="text-gray-300 text-sm"
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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

          {/* Form fields */}
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

              {/* Expertise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expertise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  placeholder="e.g., Vedic Rituals"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
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

              {/* ✅ NEW Pricing Section */}
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

              {/* Language */}
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

              {/* Image */}
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
                        src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${hoveredPandit.image}`}
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
                  <span className="font-medium text-gray-700">Expertise:</span>
                  <p className="text-gray-800">{hoveredPandit.expertise}</p>
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

                {/* ✅ NEW Pricing info in tooltip */}
                <div className="pt-2 border-t">
                  <span className="font-medium text-gray-700">Pricing:</span>
                  <p className="text-gray-800">
                    {hoveredPandit.is_free == 1
                      ? "FREE"
                      : `₹${hoveredPandit.price_per_minute}/min`}
                  </p>
                </div>

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
              <table className="w-full border min-w-[1100px] md:min-w-0">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-xs md:text-sm">#</th>
                    <th className="border p-2 text-xs md:text-sm">Image</th>
                    <th className="border p-2 text-xs md:text-sm">Name</th>
                    <th className="border p-2 text-xs md:text-sm">Type</th>
                    <th className="border p-2 text-xs md:text-sm">Temple</th>
                    <th className="border p-2 text-xs md:text-sm">Expertise</th>
                    <th className="border p-2 text-xs md:text-sm">Experience</th>
                    <th className="border p-2 text-xs md:text-sm">Languages</th>
                    <th className="border p-2 text-xs md:text-sm">Rating</th>

                    {/* ✅ NEW */}
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
                              src={`${import.meta.env.VITE_BACKEND_FOR_URL}/${pandit.image}`}
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

                      <td className="border p-2 text-xs md:text-sm">
                        {pandit.expertise}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {formatExperience(pandit.experience)}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {pandit.language}
                      </td>

                      <td className="border p-2 text-xs md:text-sm">
                        {pandit.rating}/5
                      </td>

                      {/* ✅ NEW PRICING */}
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
