import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import { uploadImage } from "../middelware/uploadImage.middleware.js";
import {
    getMessagesByConversation,
    getUserConversations,
} from "../controller/chat.controller.js";

const chatRoutes = express.Router();

// ✅ Tracking: all chats list (who talked to who)
chatRoutes.get("/conversations/:userId", isAuthenticated, getUserConversations);

// ✅ all messages of a conversation
chatRoutes.get("/messages/:conversation_id", isAuthenticated, getMessagesByConversation);

// ✅ upload file (image/video/document)
chatRoutes.post(
    "/upload",
    isAuthenticated,
    uploadImage("chat").single("file"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        return res.json({
            success: true,
            file_url: `/uploads/chat/${req.file.filename}`,
            file_name: req.file.originalname,
            file_size: req.file.size,
        });
    }
);

export default chatRoutes;
