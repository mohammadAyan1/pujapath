import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // 👈 from .env
  withCredentials: true, // 👈 important for cookies / auth
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
