

import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";

const TABS = [
  { key: "pandit", label: "Pandits", route: "/pandit" },
  { key: "puja", label: "Pujas", route: "/puja" },
  { key: "temple", label: "Temples", route: "/temple" },
  { key: "product", label: "Products", route: "/product" },
];

const IMAGE_BASE_URL = import.meta.env.VITE_BACKEND_FOR_URL;

const AdminDashboard = () => {
  const [switchTab, setSwitchTab] = useState("pandit");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ✅ Backend pagination info
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDataAccordingToTab = async (tab, pageNo = 1, pageLimit = 10) => {
    try {
      setLoading(true);

      const selectedTab = TABS.find((t) => t.key === tab);
      if (!selectedTab) return;

      const res = await api.get(
        `${selectedTab.route}?page=${pageNo}&limit=${pageLimit}`
      );

      setData(res?.data?.data || []);
      setTotalPages(res?.data?.totalPages || 1);
      setTotal(res?.data?.total || 0);
    } catch (error) {

      setData([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ When tab changes reset page
  useEffect(() => {
    setPage(1);
  }, [switchTab]);

  // ✅ Fetch when tab/page/limit changes
  useEffect(() => {
    fetchDataAccordingToTab(switchTab, page, limit);
  }, [switchTab, page, limit]);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const cleanPath = imgPath.replace(/\\/g, "/");
    // return IMAGE_BASE_URL + "/" + cleanPath;
    return IMAGE_BASE_URL + cleanPath;

  };

  const getTitle = (item) => item?.name || `#${item?.id}`;

  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-200 text-gray-700";
    return status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  const renderBackDetails = (item) => {


    const entries = Object.entries(item).filter(
      ([key]) => key !== "image" && key !== "type"
    );

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="text-sm flex gap-2">
            <span className="font-semibold capitalize min-w-[110px]">
              {key.replaceAll("_", " ")}:
            </span>
            <span className="text-gray-700 break-words">
              {value === null ? "N/A" : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ✅ Pagination numbers: 1 2 3 ... last
  const paginationNumbers = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const numbers = [];
    numbers.push(1);

    if (page > 3) numbers.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) numbers.push(i);

    if (page < totalPages - 2) numbers.push("...");

    numbers.push(totalPages);

    return numbers;
  }, [page, totalPages]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* ✅ TAB BUTTONS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSwitchTab(tab.key)}
            className={`p-4 rounded-lg shadow transition-all duration-200 font-semibold
              ${switchTab === tab.key
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-white hover:bg-gray-100"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ✅ TOP BAR: ROWS PER PAGE + INFO */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing <b>{data.length}</b> of <b>{total}</b> records
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded-md px-2 py-1 text-sm outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* ✅ LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-600 font-medium">
          Loading {switchTab} data...
        </div>
      )}

      {/* ✅ NO DATA */}
      {!loading && data.length === 0 && (
        <div className="text-center py-10 text-gray-600 font-medium">
          No {switchTab} data found!
        </div>
      )}

      {/* ✅ DATA CARDS */}
      {!loading && data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map((item) => (
              <FlipCard
                key={item?.id}
                title={getTitle(item)}
                imageUrl={getImageUrl(item?.image)}
                status={item?.status}
                backContent={renderBackDetails(item)}
                statusClass={getStatusBadge(item?.status)}
              />
            ))}
          </div>

          {/* ✅ PAGINATION */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded-md border text-sm ${page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
                }`}
            >
              Prev
            </button>

            {paginationNumbers.map((num, idx) =>
              num === "..." ? (
                <span key={idx} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`px-3 py-1 rounded-md border text-sm ${page === num
                    ? "bg-orange-600 text-white border-orange-600"
                    : "hover:bg-gray-100"
                    }`}
                >
                  {num}
                </button>
              )
            )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded-md border text-sm ${page === totalPages
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-gray-100"
                }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

/* ✅ Flip Card Component */
const FlipCard = ({ title, imageUrl, status, backContent, statusClass }) => {
  return (
    <div className="w-full h-[320px] [perspective:1000px]">
      <div
        className="relative w-full h-full transition-transform duration-700
        [transform-style:preserve-3d] hover:[transform:rotateY(180deg)]"
      >
        {/* ✅ FRONT */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-md p-4
          [backface-visibility:hidden] flex flex-col justify-between"
        >
          <div className="h-[170px] w-full rounded-xl overflow-hidden bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-800 line-clamp-1">
              {title}
            </h2>

            {status && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClass}`}
              >
                {status}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500 mt-2">
            Hover to see details 🔄
          </div>
        </div>

        {/* ✅ BACK */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-md p-4 overflow-auto
          [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <h3 className="text-lg font-bold mb-3 text-orange-600">Details</h3>
          {backContent}
        </div>
      </div>
    </div>
  );
};
