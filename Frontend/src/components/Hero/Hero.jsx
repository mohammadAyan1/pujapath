import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDebounce from "../../utils/useDebounce";
import api from "../../api/axios";

// ✅ Build URL based on type
const getLinkByType = (item) => {
    if (item.type === "temple") return `/temple/${item.id}`;
    if (item.type === "puja") return `/puja/${item.id}`;
    if (item.type === "product") return `/product/${item.id}`;
    if (item.type === "pandit/astro") return `/pandit/${item.id}`;
    return "/";
};

export default function SearchBarWithSuggestions({ className = "" }) {
    const navigate = useNavigate();
    const location = useLocation();

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const [query, setQuery] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);

    const debouncedSearch = useDebounce(query, 600);

    // ✅ Close dropdown when route changes
    useEffect(() => {
        setFiltered([]);
        setActiveIndex(-1);
        setLoading(false);
    }, [location.pathname]);

    // ✅ Fetch suggestions
    useEffect(() => {
        const fetchData = async () => {
            const q = debouncedSearch.trim();

            if (!q) {
                setFiltered([]);
                setActiveIndex(-1);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const res = await api.get(`/find?search=${encodeURIComponent(q)}`);

                setFiltered(res?.data?.data || []);
                setActiveIndex(-1);
            } catch (error) {
                console.log("Search error:", error);
                setFiltered([]);
                setActiveIndex(-1);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [debouncedSearch]);

    // ✅ Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target)) {
                setFiltered([]);
                setActiveIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = () => {
        const q = query.trim();
        if (!q) return;

        navigate(`/product?search=${encodeURIComponent(q)}`);
        setFiltered([]);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (filtered.length === 0) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();

            if (activeIndex >= 0) {
                const selected = filtered[activeIndex];
                navigate(getLinkByType(selected));
                setQuery(selected.name || "");
                setFiltered([]);
                setActiveIndex(-1);
            } else {
                handleSearch();
            }
            return;
        }

        if (e.key === "Escape") {
            setFiltered([]);
            setActiveIndex(-1);
            return;
        }
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <div className="flex bg-white rounded-xl overflow-hidden shadow border">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search Puja, Temple, Products, Pandit..."
                    className="w-full px-4 py-2 outline-none text-gray-900 text-sm"
                />

                <button
                    onClick={handleSearch}
                    className="bg-orange-500 hover:bg-orange-600 px-4 text-white font-semibold transition text-sm"
                >
                    Search
                </button>
            </div>

            {/* ✅ Loading UI */}
            {loading && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl px-4 py-3 text-gray-600 z-50 border text-sm">
                    Searching...
                </div>
            )}

            {/* ✅ Suggestions */}
            {!loading && filtered.length > 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-50 border">
                    {filtered.map((item, index) => (
                        <button
                            key={`${item.type}-${item.id}-${index}`}
                            onClick={() => {
                                navigate(getLinkByType(item));
                                setQuery(item.name || "");
                                setFiltered([]);
                                setActiveIndex(-1);
                            }}
                            className={`w-full text-left px-4 py-3 text-gray-800 flex justify-between items-center transition
              ${activeIndex === index ? "bg-gray-100" : "hover:bg-gray-50"}`}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.name}</span>

                                {item.extra_info && (
                                    <span className="text-xs text-gray-500">
                                        {item.extra_info}
                                    </span>
                                )}
                            </div>

                            <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-600">
                                {item.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* ✅ No results */}
            {!loading && query.trim() && filtered.length === 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl px-4 py-3 text-gray-500 z-50 border text-sm">
                    No results found
                </div>
            )}
        </div>
    );
}
