import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_BACKEND_FOR_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false, // ✅ we will connect after user available
});
