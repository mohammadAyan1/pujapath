import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
///
import morgan from "morgan";

import redisClient from "./src/utils/redis.js";

import authRoutes from "./src/routes/auth.routes.js";
import templeRoutes from "./src/routes/temple.routes.js";
import pujaCategory from "./src/routes/puja-category.routes.js";
import pujaRoutes from "./src/routes/puja.routes.js";
import panditRoutes from "./src/routes/pandit.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import productCategoryRoutes from "./src/routes/productCategory.routes.js";
import addToCardRoutes from "./src/routes/addToCard.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import findRoutes from "./src/routes/find.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import addressRoutes from "./src/routes/address.routes.js";
import productBookingRoutes from "./src/routes/productBooking.routes.js";
import pujaBookingRoutes from "./src/routes/pujaBooking.routes.js";
import astroBookingRoutes from "./src/routes/astroBook.routes.js";
import homeRoutes from "./src/routes/home.routes.js";
import myBookingRoutes from "./src/routes/myBooking.routes.js";
import {
  getOrCreateConversation,
  saveMessage,
} from "./src/controller/chat.controller.js";
import cardBookingRoutes from "./src/routes/cartBooking.routes.js";
import { errorHandler } from "./src/middelware/errorHandler.js";
import { requestTracker } from "./src/middelware/requestTracker.js";
import { requestLogger } from "./src/middelware/requestLogger.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
import { register } from "./src/monitoring/metrics.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://641xkt6n-5173.inc1.devtunnels.ms", "http://13.201.22.73", process.env.FRONTEND_URL], // frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestTracker);
app.use(requestLogger);
app.use(helmet());
app.use(compression());

////
app.use(morgan("combined"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.get("/api", (req, res) => {
  res.send("Server is running");
});


app.get("/api/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use(
  "/api/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/temple", templeRoutes);
app.use("/api/puja-category", pujaCategory);
app.use("/api/puja", pujaRoutes);
app.use("/api/pandit", panditRoutes);
app.use("/api/astro-booking", astroBookingRoutes);
app.use("/api/product-category", productCategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/product-addtocard", addToCardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/find", findRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/product-booking", productBookingRoutes);
app.use("/api/puja-booking", pujaBookingRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/bookings", myBookingRoutes);
app.use("/api/cart-booking", cardBookingRoutes);



// ✅ Static for images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://641xkt6n-5173.inc1.devtunnels.ms", "http://13.201.22.73"],
    credentials: true,
  },
});

// ✅ Online users store
let onlineUsers = {}; // { userId: socketId }

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // ✅ user joins
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("✅ JOIN:", userId, "Socket:", socket.id);
    console.log("✅ onlineUsers:", onlineUsers);
  });


  // ✅ Send message (text/file)
  socket.on("sendMessage", async (payload) => {
    try {
      const { sender_id, receiver_id } = payload;

      // ✅ Create or get conversation
      const conv = await getOrCreateConversation(sender_id, receiver_id);

      // ✅ Save message
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

      // ✅ Send to receiver
      const receiverSocket = onlineUsers[receiver_id];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", saved);
      }

      // ✅ Also send back to sender
      socket.emit("receiveMessage", saved);
    } catch (error) {
      console.log("❌ sendMessage error:", error);
      socket.emit("errorMessage", "Message send failed!");
    }
  });

  // =====================================================
  // ✅ VOICE CALL SOCKET EVENTS (FIXED)
  // =====================================================

  // ✅ Voice Call: request
  socket.on("call:request", ({ fromUserId, toUserId, roomId, callType }) => {
    console.log("📞 Call request:", { fromUserId, toUserId, roomId, callType });

    const receiverSocket = onlineUsers[toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("call:incoming", {
        fromUserId,
        roomId,
        callType,
      });
    } else {
      socket.emit("call:user-offline", { toUserId });
    }
  });

  // ✅ Voice Call: accept
  socket.on("call:accept", ({ fromUserId, toUserId, roomId }) => {
    console.log("✅ Call accepted:", { fromUserId, toUserId, roomId });

    const callerSocket = onlineUsers[fromUserId];
    if (callerSocket) {
      io.to(callerSocket).emit("call:accepted", { roomId, toUserId });
    }
  });

  // ✅ Voice Call: reject
  socket.on("call:reject", ({ fromUserId, roomId }) => {
    console.log("❌ Call rejected:", { fromUserId, roomId });

    const callerSocket = onlineUsers[fromUserId];
    if (callerSocket) {
      io.to(callerSocket).emit("call:rejected", { roomId });
    }
  });

  // ✅ WebRTC offer
  socket.on("webrtc:offer", ({ toUserId, roomId, offer }) => {
    const receiverSocket = onlineUsers[toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("webrtc:offer", { roomId, offer });
    }
  });

  // ✅ WebRTC answer
  socket.on("webrtc:answer", ({ toUserId, roomId, answer }) => {
    const receiverSocket = onlineUsers[toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("webrtc:answer", { roomId, answer });
    }
  });

  // ✅ WebRTC ice candidate
  socket.on("webrtc:ice", ({ toUserId, roomId, candidate }) => {
    const receiverSocket = onlineUsers[toUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("webrtc:ice", { roomId, candidate });
    }
  });

  // ✅ End call
  socket.on("call:end", ({ toUserId, roomId }) => {
    console.log("📴 Call ended:", { toUserId, roomId });

    const receiverSocket = onlineUsers[toUserId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("call:end", { roomId });
    }
  });

  // ✅ disconnect
  socket.on("disconnect", () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }

    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// server.listen(PORT, () => {
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });


// server.listen(PORT || 3000, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT || 3000}`);
//   console.log("Auto deploy working");
//   console.log("CI/CD Working");

// });



const startServer = async () => {
  try {
    await redisClient.connect();

    console.log("Redis Connected");

    server.listen(PORT || 3000, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT || 3000}`);
      console.log("Auto deploy working");
      console.log("CI/CD Working");
    });
  } catch (error) {
    console.log("Redis Connection Failed:", error);
    process.exit(1);
  }
};

startServer();


// app.listen(PORT || 3000, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT || 3000}`);
//   console.log("Auto deploy working")
//   console.log("CI/CD Working");
// });