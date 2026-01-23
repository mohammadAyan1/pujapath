import AppRoutes from "./routes/AppRoutes";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "./api/axios";
import { useAuth } from "./AuthContext/AuthContext";
import { useCart } from "./CartContext/CartContext";

function App() {
  const { fetchCart } = useCart()
  const { setUser } = useAuth();
  const location = useLocation();
  const [heroClose, setHeroClose] = useState(true)

  const fetchUserDetails = async () => {
    try {
      const res = await api.get("/auth/checkUserLogin");
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUserDetails();

    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/chat") || location.pathname.startsWith("/checkout") || location.pathname.startsWith("/puja-checkout") || location.pathname.startsWith("/astro-checkout") || location.pathname.startsWith("/cart") || location.pathname.startsWith("/login")) {
      setHeroClose(false);
    } else {
      setHeroClose(true);
    }
    fetchCart()
  }, [location.pathname]);  // 🔥 runs on every route change

  return <AppRoutes heroClose={heroClose} />;
}

export default App;
