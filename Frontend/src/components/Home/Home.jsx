import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// ✅ Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// ✅ Icons
import { FaOm, FaPrayingHands, FaShoppingBag, FaVideo } from "react-icons/fa";

const BASE_URL_IMAGE = import.meta.env.VITE_BACKEND_FOR_URL;

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [homeData, setHomeData] = useState({
    temples: [],
    pandits: [],
    products: [],
    pujas: [],
    recommended: {
      pandits: [],
      pujas: [],
      products: [],
    },
  });

  const getImageUrl = (imgPath) => {
    if (!imgPath) return "/no-image.png";
    if (imgPath.startsWith("http")) return imgPath;
    return `${BASE_URL_IMAGE}/${imgPath}`;
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/home");

      if (res?.data?.success) {
        setHomeData(res?.data?.data);
      } else {
        toast.error("Failed to load home");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Home loading failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // ✅ Slider banners
  const banners = useMemo(() => {
    return [
      {
        id: 1,
        title: "Book Puja Easily",
        subtitle: "Trusted temples & verified pandits",
        image: "https://pragyata.com/wp-content/uploads/2020/10/Durga-Puja-Odisha.jpg",
        action: () => navigate("/puja"),
        btn: "Book Puja",
      },
      {
        id: 2,
        title: "Live Darshan",
        subtitle: "Watch temples live anytime",
        image: "https://media.istockphoto.com/id/508628776/photo/sunset-over-kandariya-mahadeva-temple.jpg?s=612x612&w=0&k=20&c=YOpVZmLiY4ccl_aoWRJhfqLpNEDgjyOGuTAKbobCO-U=",
        action: () => navigate("/temple"),
        btn: "Explore Temples",
      },
      {
        id: 3,
        title: "Talk to Pandit",
        subtitle: "Astrology + Guidance instantly",
        image: "https://blog.byoh.in/wp-content/uploads/2016/04/PanditJi.jpg",
        action: () => navigate("/pandit"),
        btn: "Consult Now",
      },
    ];
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ SLIDER */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="h-[190px] md:h-[260px] rounded-2xl skeleton"></div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={true}
            >
              {banners.map((b) => (
                <SwiperSlide key={b.id}>
                  <div className="relative h-[190px] md:h-[260px] w-full">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.src = "/no-image.png")}
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>

                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white max-w-[75%]">
                      <h2 className="text-xl md:text-3xl font-bold">{b.title}</h2>
                      <p className="text-sm md:text-base text-white/90 mt-1">
                        {b.subtitle}
                      </p>

                      <button
                        onClick={b.action}
                        className="mt-3 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold"
                      >
                        {b.btn}
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* ✅ CATEGORY ICONS */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-4 gap-3">
          <CategoryButton
            title="Puja"
            icon={<FaPrayingHands />}
            onClick={() => navigate("/puja")}
          />
          <CategoryButton
            title="Darshan"
            icon={<FaVideo />}
            onClick={() => navigate("/temple")}
          />
          <CategoryButton
            title="Pandit"
            icon={<FaOm />}
            onClick={() => navigate("/pandit")}
          />
          <CategoryButton
            title="Store"
            icon={<FaShoppingBag />}
            onClick={() => navigate("/products")}
          />
        </div>
      </div>

      {/* ✅ CONTENT */}
      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-10">
        {/* ✅ Recommended Section */}
        <SectionHeader
          title="Recommended For You ⭐"
          actionText="View More"
          onAction={() => navigate("/recommended")}
        />

        {loading ? (
          <HorizontalSkeleton />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {homeData?.recommended?.pandits?.map((p) => (
              <PanditCard
                key={p.id}
                pandit={p}
                getImageUrl={getImageUrl}
                onClick={() => navigate(`/pandit/${p.id}`)}
              />
            ))}
          </div>
        )}

        {/* ✅ Trending Pujas */}
        <HorizontalSection
          title="Trending Pujas"
          actionText="View All"
          onAction={() => navigate("/puja")}
          loading={loading}
        >
          {homeData?.pujas?.map((puja) => (
            <PujaCard
              key={puja.id}
              puja={puja}
              getImageUrl={getImageUrl}
              onClick={() => navigate(`/puja/${puja.id}`)}
            />
          ))}
        </HorizontalSection>

        {/* ✅ Temples */}
        <HorizontalSection
          title="Temples & Live Darshan"
          actionText="View All"
          onAction={() => navigate("/temple")}
          loading={loading}
        >
          {homeData?.temples?.map((temple) => (
            <TempleCard key={temple.id} temple={temple} getImageUrl={getImageUrl} onClick={() => navigate(`/temple/${temple.id}`)} />
          ))}
        </HorizontalSection>

        {/* ✅ Pandits */}
        <HorizontalSection
          title="Talk to Pandit / Astrologer"
          actionText="View All"
          onAction={() => navigate("/pandit")}
          loading={loading}
        >
          {homeData?.pandits?.map((p) => (
            <PanditCard
              key={p.id}
              pandit={p}
              getImageUrl={getImageUrl}
              onClick={() => navigate(`/pandit/${p.id}`)}
            />
          ))}
        </HorizontalSection>

        {/* ✅ Products */}
        <HorizontalSection
          title="Pooja Store"
          actionText="View All"
          onAction={() => navigate("/product")}
          loading={loading}
        >
          {homeData?.products?.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              getImageUrl={getImageUrl}
              onClick={() => navigate(`/product/${prod.id}`)}
            />
          ))}
        </HorizontalSection>
      </div>
    </div>
  );
};

/* ✅ COMPONENTS */

const CategoryButton = ({ title, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow transition flex flex-col items-center justify-center py-4 gap-2"
    >
      <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-800">{title}</p>
    </button>
  );
};

const SectionHeader = ({ title, actionText, onAction }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base md:text-lg font-bold text-gray-800">{title}</h2>
      <button
        onClick={onAction}
        className="text-sm text-orange-600 font-semibold hover:underline"
      >
        {actionText} →
      </button>
    </div>
  );
};

const HorizontalSection = ({ title, actionText, onAction, children, loading }) => {
  return (
    <div>
      <SectionHeader title={title} actionText={actionText} onAction={onAction} />

      {loading ? (
        <HorizontalSkeleton />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {children}
        </div>
      )}
    </div>
  );
};

/* ✅ Skeleton Horizontal Loader */
const HorizontalSkeleton = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="min-w-[220px] bg-white rounded-xl shadow overflow-hidden"
        >
          <div className="h-32 skeleton"></div>
          <div className="p-3 space-y-2">
            <div className="h-4 w-[80%] rounded skeleton"></div>
            <div className="h-3 w-[60%] rounded skeleton"></div>
            <div className="h-4 w-[40%] rounded skeleton"></div>
            <div className="h-9 w-full rounded-lg skeleton mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PujaCard = ({ puja, getImageUrl, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="min-w-[220px] bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
    >
      <div className="h-32 bg-gray-100">
        <img
          src={getImageUrl(puja.image)}
          alt={puja.name}
          className="h-full w-full object-cover"
          onError={(e) => (e.target.src = "/no-image.png")}
        />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 line-clamp-2">
          {puja.name}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {puja.temple_name}, {puja.temple_city}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">₹ {puja.price}</p>
        <button className="mt-3 w-full py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition">
          Book Now
        </button>
      </div>
    </div>
  );
};

const TempleCard = ({ temple, getImageUrl, onClick }) => {
  return (

    <div
      onClick={onClick}
      className="min-w-[220px] bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      <div className="h-32 bg-gray-100 cursor-pointer">
        <img
          src={getImageUrl(temple.image)}
          alt={temple.name}
          className="h-full w-full object-cover"
          onError={(e) => (e.target.src = "/no-image.png")}
        />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 line-clamp-2">
          {temple.name}
        </p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          {temple.city}, {temple.state}
        </p>

        {temple.has_live === 1 && temple.live_url && (
          <a
            href={temple.live_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-3 text-sm text-orange-600 font-semibold hover:underline"
          >
            Live Darshan →
          </a>
        )}
      </div>
    </div>
  );
};

const PanditCard = ({ pandit, getImageUrl, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="min-w-[240px] bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer p-4"
    >
      <div className="flex items-center gap-3">
        <img
          src={getImageUrl(pandit.image)}
          alt={pandit.name}
          className="h-12 w-12 rounded-full object-cover border"
          onError={(e) => (e.target.src = "/no-image.png")}
        />
        <div>
          <p className="font-semibold text-gray-800 text-sm">{pandit.name}</p>
          <p className="text-xs text-gray-500">{pandit.expertise}</p>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
        <p>⭐ {pandit.rating || "4.5"}</p>
        <p>{pandit.experience} yrs</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">
          {pandit.is_free === 1 ? "FREE" : `₹${pandit.price_per_minute}/min`}
        </p>

        <span
          className={`text-xs px-2 py-1 rounded-full ${pandit.is_available === 1
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {pandit.is_available === 1 ? "Available" : "Busy"}
        </span>
      </div>

      <button className="mt-3 w-full py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition">
        Consult Now
      </button>
    </div>
  );
};

const ProductCard = ({ product, getImageUrl, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="min-w-[220px] bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
    >
      <div className="h-32 bg-gray-100">
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => (e.target.src = "/no-image.png")}
        />
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 line-clamp-2">
          {product.name}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">
          ₹ {product.price}
        </p>
        <button className="mt-3 w-full py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition">
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default Home;
