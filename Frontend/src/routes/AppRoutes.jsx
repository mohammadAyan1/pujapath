import { Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Auth from "../components/Auth/Auth";
import VerifyEmail from "../components/VerifyEmail/VerifyEmail";
import ForgotPassword from "../components/Auth/ForgotPassword";
import ResetPassword from "../components/Auth/ResetPassword";
import Home from "../components/Home/Home";
import Puja from "../components/Puja/Puja";
import Products from "../components/Products/Products";
import AdminDashboard from "../components/Admin/AdminDashboard/AdminDashboard";
import AdminLayout from "../components/Admin/AdminLayout/AdminLayout";
import Admintemple from "../components/Admin/AdminTemple/Admintemple";
import AdminProduct from "../components/Admin/AdminProduct/AdminProduct";
import AdminProductCategory from "../components/Admin/AdminProductCategory/AdminProductCategory";
import AdminPujaCategory from "../components/Admin/AdminPujaCategory/AdminPujaCategory";
import AdminPuja from "../components/Admin/AdminPuja/AdminPuja";
import AdminPandit from "../components/Admin/AdminPandit/AdminPandit";
import AdminUsers from "../components/Admin/AdminUsers/AdminUsers";
import ChatPage from "../pages/ChatPage";
import Checkout from "../components/Checkout/Checkout";
import Cart from "../pages/Cart/Cart";
import Pandit from "../pages/Pandit/Pandit";
import Temple from "../components/Temple/Temple";
import PujaCheckout from "../components/PujaCheckout/PujaCheckout";
import AstroCheckout from "../components/AstroCheckout/AstroCheckout";
import SearchBarWithSuggestions from "../components/Hero/Hero";
import PanditDetail from "../pages/Details/PanditDetail";
import ProductDetail from "../pages/Details/ProductDetail";
import PujaDetail from "../pages/Details/PujaDetail";
import TempleDetail from "../pages/Details/TempleDetail";
import MyBookings from "../components/MyBookings/MyBookings";
import BookingDetails from "../components/BookingDetails/BookingDetails";
const AppRoutes = ({ heroClose }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="temple" element={<Admintemple />} />
            <Route path="product" element={<AdminProduct />} />
            <Route path="product/category" element={<AdminProductCategory />} />
            <Route path="puja/category" element={<AdminPujaCategory />} />
            <Route path="puja" element={<AdminPuja />} />
            <Route path="pandit" element={<AdminPandit />} />
            <Route path="user" element={<AdminUsers />} />
          </Route>
          <Route path="/login" element={<Auth />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/puja" element={<Puja />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pandit" element={<Pandit />} />
          <Route path="/temple" element={<Temple />} />
          <Route path="/puja-checkout/:id" element={<PujaCheckout />} />
          <Route path="/astro-checkout/:id" element={<AstroCheckout />} />

          {/*  */}
          <Route path="/sky-info-group" element={<Auth />} />

          {/*  */}
          {/* ✅ Detail routes */}
          <Route path="/pandit/:id" element={<PanditDetail />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/puja/:id" element={<PujaDetail />} />
          <Route path="/temple/:id" element={<TempleDetail />} />
          {/* Booking */}
          <Route path="/bookings" element={<MyBookings />} />
          {/* booking details */}
          <Route path="/booking/detaild/:type/:id" element={<BookingDetails />} />

        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default AppRoutes;
