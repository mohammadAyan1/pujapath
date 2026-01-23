
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useDebounce from "../../utils/useDebounce";
import api from "../../api/axios";

const slides = [
    {
        title: "Book Your Puja Easily",
        desc: "Choose puja, select date & time, and confirm booking in minutes.",
        img: "https://images.pexels.com/photos/6045076/pexels-photo-6045076.jpeg",
    },
    {
        title: "Buy Puja Products Online",
        desc: "Get puja essentials delivered at your doorstep with best offers.",
        img: "https://images.pexels.com/photos/6693652/pexels-photo-6693652.jpeg",
    },
    {
        title: "Verified Pandit Booking",
        desc: "Hire verified pandits for rituals anytime with easy booking.",
        img: "https://images.pexels.com/photos/8789439/pexels-photo-8789439.jpeg",
    },
];

// ✅ Build URL based on type
const getLinkByType = (item) => {
    if (item.type === "temple") return `/temple/${item.id}`;
    if (item.type === "puja") return `/puja/${item.id}`;
    if (item.type === "product") return `/products/${item.id}`;
    if (item.type === "pandit/astro") return `/pandit/${item.id}`;
    return "/";
};

export default function HeroWithSearch() {
    const navigate = useNavigate();

    // Slider state
    const [current, setCurrent] = useState(0);
    const [isHover, setIsHover] = useState(false);
    const intervalRef = useRef(null);

    // Search state
    const [query, setQuery] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [loading, setLoading] = useState(false);

    const inputRef = useRef(null);

    // ✅ Auto Slider
    const startAutoSlide = () => {
        intervalRef.current = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 4000);
    };

    const stopAutoSlide = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    useEffect(() => {
        if (!isHover) startAutoSlide();
        return () => stopAutoSlide();
    }, [isHover]);

    const debouncedSearch = useDebounce(query, 600);

    // ✅ Dynamic suggestions from API
    useEffect(() => {
        const fetchData = async () => {
            const q = debouncedSearch.trim();

            // ✅ If empty clear dropdown
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

    // ✅ Enter Search (if user clicks search button)
    const handleSearch = () => {
        const q = query.trim();
        if (!q) return;

        // you can navigate to a search page if you want
        navigate(`/products?search=${encodeURIComponent(q)}`);
    };

    // ✅ Keyboard navigation
    const handleKeyDown = (e) => {
        if (filtered.length === 0) {
            if (e.key === "Enter") handleSearch();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        }

        if (e.key === "Enter") {
            e.preventDefault();

            if (activeIndex >= 0) {
                const selected = filtered[activeIndex];
                navigate(getLinkByType(selected));
                setQuery(selected.name);
                setFiltered([]);
                setActiveIndex(-1);
            } else {
                handleSearch();
            }
        }

        if (e.key === "Escape") {
            setFiltered([]);
            setActiveIndex(-1);
        }
    };

    return (
        <section
            className="relative w-full h-[85vh] overflow-hidden"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
        >
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${current === index ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    <img
                        src={slide.img}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center">
                        <div className="max-w-6xl mx-auto px-6 w-full text-white">
                            {/* Text */}
                            <div
                                className={`transition-all duration-700 ease-out ${current === index
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-10"
                                    }`}
                            >
                                <h1 className="text-3xl md:text-5xl font-bold mb-3">
                                    {slide.title}
                                </h1>
                                <p className="text-base md:text-xl mb-6 max-w-2xl text-white/90">
                                    {slide.desc}
                                </p>
                            </div>

                            {/* Search Box */}
                            <div className="relative max-w-2xl">
                                <div className="flex bg-white rounded-xl overflow-hidden shadow-lg">
                                    <input
                                        ref={inputRef}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search Puja, Temple, Products, Pandit..."
                                        className="w-full px-4 py-3 outline-none text-gray-900"
                                    />

                                    <button
                                        onClick={handleSearch}
                                        className="bg-orange-500 hover:bg-orange-600 px-6 text-white font-semibold transition"
                                    >
                                        Search
                                    </button>
                                </div>

                                {/* ✅ Loading text */}
                                {loading && (
                                    <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl px-4 py-3 text-gray-600 z-50">
                                        Searching...
                                    </div>
                                )}

                                {/* Suggestions Dropdown */}
                                {!loading && filtered.length > 0 && (
                                    <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-50">
                                        {filtered.map((item, index) => (
                                            <button
                                                key={`${item.type}-${item.id}-${index}`}
                                                onClick={() => {
                                                    navigate(getLinkByType(item));
                                                    setQuery(item.name);
                                                    setFiltered([]);
                                                    setActiveIndex(-1);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-gray-800 flex justify-between items-center hover:bg-gray-100 transition ${activeIndex === index ? "bg-gray-100" : ""
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>

                                                    {/* ✅ extra info (category / temple name) */}
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
                            </div>

                            {/* Small Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {["Hanuman Puja", "Shiv", "Rudraksha", "Pandit"].map((tag, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(tag)}
                                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
