import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.routes.js";
import templeRoutes from "./src/routes/temple.routes.js";
import pujaCategory from "./src/routes/puja-category.routes.js";
import pujaRoutes from "./src/routes/puja.routes.js";
import panditRoutes from "./src/routes/pandit.routes.js";
import path from "path";
// import pujaBookRoutes from "./src/routes/pujaBooking.routes.js";
import astroBookRoutes from "./src/routes/astroBook.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import productCategoryRoutes from "./src/routes/productCategory.routes.js";
import addToCardRoutes from "./src/routes/addToCard.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import findRoutes from "./src/routes/find.routes.js";
import http from "http";
import { Server } from "socket.io";
import chatRoutes from "./src/routes/chat.routes.js";
import { getOrCreateConversation, saveMessage } from "./src/controller/chat.controller.js";
import addressRoutes from "./src/routes/address.routes.js";
import productBookingRoutes from "./src/routes/productBooking.routes.js";
import pujaBookingRoutes from "./src/routes/pujaBooking.routes.js";

// import panditAvailableRoutes from "./src/routes/panditAvailable.routes.js";
dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ ADD THESE TWO LINES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/temple", templeRoutes);
app.use("/api/puja-category", pujaCategory);
app.use("/api/puja", pujaRoutes);
app.use("/api/pandit", panditRoutes);
// app.use("/api/puja-book", pujaBookRoutes);
app.use("/api/astro-book", astroBookRoutes);
app.use("/api/product-category", productCategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/product-addtocard", addToCardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/find", findRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/product-booking", productBookingRoutes);
app.use("/api/puja-booking", pujaBookingRoutes);
// app.use("/api/pandit-availability", panditAvailableRoutes);

///!SECTION for image get
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

let onlineUsers = {}; // userId : socketId

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ✅ user joins
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // ✅ Send message (text/file)
  socket.on("sendMessage", async (payload) => {
    try {
      const { sender_id, receiver_id } = payload;

      // Create or get conversation
      const conv = await getOrCreateConversation(sender_id, receiver_id);

      // Save message
      const saved = await saveMessage({
        conversation_id: conv.id,
        sender_id,
        receiver_id,
        message_type: payload.message_type,
        text_message: payload.text_message || null,
        file_url: payload.file_url || null,
        file_name: payload.file_name || null,
        file_size: payload.file_size || null,
      });

      // Send to receiver
      const receiverSocket = onlineUsers[receiver_id];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", saved);
      }

      // Also send back to sender
      socket.emit("receiveMessage", saved);
    } catch (error) {
      console.log("sendMessage error:", error);
      socket.emit("errorMessage", "Message send failed!");
    }
  });

  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

