import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { FaUserCircle, FaShoppingCart } from "react-icons/fa";
import { useAuth } from "../../AuthContext/AuthContext";
import { useCart } from "../../CartContext/CartContext";
import SearchBarWithSuggestions from "../Hero/Hero";
const Navbar = () => {
  const { cartCount } = useCart();

  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  /* ======================
     LOGOUT
  ====================== */
  const handleLogout = async () => {
    await api.post("/auth/logout"); // optional if you implement
    setUser(null);
    navigate("/login");
  };

  /* ======================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ====================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileNavigate = (path) => {
    setOpen(false); // ✅ close menu
    navigate(path); // ✅ navigate
  };

  return (
    <nav className="bg-white border-b shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* LOGO */}
          <Link to="/" className="text-xl font-bold text-orange-600">
            PujaPath
          </Link>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
            {/* ✅ Search Bar */}
            <div className="w-[350px]">
              <SearchBarWithSuggestions />
            </div>

            <Link to="/products" className="nav-link">
              Products
            </Link>
            <Link to="/puja" className="nav-link">
              Puja
            </Link>
            <Link to="/pandit" className="nav-link">
              Pandit
            </Link>
            <Link to="/temple" className="nav-link">
              Temple
            </Link>

            {/* CART (ALWAYS VISIBLE) */}
            <Link to="/cart" className="relative text-gray-700">
              <FaShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* AUTH SECTION */}
            {!user ? (
              <Link
                to="/login"
                className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600"
              >
                Login
              </Link>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-700 hover:text-orange-600"
                >
                  <FaUserCircle size={28} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md">
                    <div className="px-4 py-2 text-sm text-gray-600">
                      {user?.name}
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Profile
                    </Link>

                    <Link
                      to="/bookings"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      My Bookings
                    </Link>

                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 hover:bg-gray-100 text-orange-600"
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 pt-4">
            <SearchBarWithSuggestions />
          </div>

          <div className="flex flex-col px-4 py-3 gap-3">
            <button
              onClick={() => handleMobileNavigate("/products")}
              className="text-left"
            >
              Products
            </button>

            <button
              onClick={() => handleMobileNavigate("/puja")}
              className="text-left"
            >
              Puja
            </button>

            <button
              onClick={() => handleMobileNavigate("/pandit")}
              className="text-left"
            >
              Pandits
            </button>

            <button
              onClick={() => handleMobileNavigate("/temple")}
              className="text-left"
            >
              Temple
            </button>

            <button
              onClick={() => handleMobileNavigate("/cart")}
              className="text-left"
            >
              Cart
            </button>

            {!user ? (
              <button
                onClick={() => handleMobileNavigate("/login")}
                className="bg-orange-500 text-white px-4 py-2 rounded-md text-left"
              >
                Login
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleMobileNavigate("/profile")}
                  className="text-left"
                >
                  Profile
                </button>

                <button
                  onClick={() => handleMobileNavigate("/bookings")}
                  className="text-left"
                >
                  My Bookings
                </button>

                {user.role === "admin" && (
                  <button
                    onClick={() => handleMobileNavigate("/admin")}
                    className="text-left text-orange-600"
                  >
                    Admin Panel
                  </button>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="text-left text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
