import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./AuthContext/AuthContext.jsx";
import { CartProvider } from "./CartContext/CartContext.jsx"
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <App />
          <ToastContainer position="top-right" autoClose={3000} />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
