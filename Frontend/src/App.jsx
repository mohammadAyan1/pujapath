import AppRoutes from "./routes/AppRoutes";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "./api/axios";
import { useAuth } from "./AuthContext/AuthContext";
import { useCart } from "./CartContext/CartContext";
import { socket } from "./socket/socket";
import CallReceiver from "./components/VoiceCallModal/CallReceiver";
function App() {
  const { fetchCart } = useCart();
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [heroClose, setHeroClose] = useState(true);

  const fetchUserDetails = async () => {
    try {
      const res = await api.get("/auth/checkUserLogin");
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  };

  // ✅ fetch user every route (your current logic)
  useEffect(() => {
    fetchUserDetails();

    if (location.pathname === "/chat" || location.pathname.startsWith("/admin")) {
      setHeroClose(false);
    } else {
      setHeroClose(true);
    }

    fetchCart();
  }, [location.pathname]);

  // ✅ Connect socket when user is available
  useEffect(() => {
    if (user?.id) {
      if (!socket.connected) socket.connect();

      socket.emit("join", user.id); // ✅ join online users (your backend)
    } else {
      if (socket.connected) socket.disconnect();
    }
  }, [user?.id]);

  return (
    <>
      <CallReceiver />
      <AppRoutes heroClose={heroClose} />;
    </>
  )
}

export default App;
