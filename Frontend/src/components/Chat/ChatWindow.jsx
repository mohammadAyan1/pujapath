import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { socket } from "../../socket/socket";
import { getMessageType } from "../../utils/fileType";
import MessageBubble from "./MessageBubble";
import FilePreview from "./FilePreview";

export default function ChatWindow({ me, selectedUser }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [conversationId, setConversationId] = useState(null);

    const messageEndRef = useRef();

    const scrollBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fixFileUrl = (url) => {
        if (!url) return null;
        return url.replace("/api/uploads", "/uploads").replace("/api", "");
    };

    // ✅ load conversation + messages
    const loadChat = async () => {
        if (!me || !selectedUser) return;

        const convRes = await api.get(`/chat/conversations/${me.id}`);

        const conv = convRes.data.find((c) => {
            return (
                (c.user1_id === me.id && c.user2_id === selectedUser.id) ||
                (c.user1_id === selectedUser.id && c.user2_id === me.id)
            );
        });

        if (conv) {
            setConversationId(conv.id);

            const msgRes = await api.get(`/chat/messages/${conv.id}`);

            const updatedMessages = msgRes.data.map((msg) => ({
                ...msg,
                file_url: msg.file_url ? fixFileUrl(msg.file_url) : null,
            }));

            setMessages(updatedMessages);
        } else {
            setConversationId(null);
            setMessages([]);
        }
    };

    // ✅ socket receiver
    useEffect(() => {
        socket.emit("join", me?.id);

        const handleReceiveMessage = (msg) => {
            // ✅ fix invalid date instantly if missing
            const fixedMsg = {
                ...msg,
                created_at: msg.created_at || new Date().toISOString(),
                file_url: msg.file_url ? fixFileUrl(msg.file_url) : null,
            };

            if (
                (fixedMsg.sender_id === me?.id && fixedMsg.receiver_id === selectedUser?.id) ||
                (fixedMsg.sender_id === selectedUser?.id && fixedMsg.receiver_id === me?.id)
            ) {
                setMessages((prev) => [...prev, fixedMsg]);
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [me, selectedUser]);

    useEffect(() => {
        loadChat();
    }, [me, selectedUser]);

    useEffect(() => {
        scrollBottom();
    }, [messages]);

    // ✅ Send Text Message
    const handleSendText = () => {
        if (!text.trim() || !selectedUser) return;

        socket.emit("sendMessage", {
            sender_id: me.id,
            receiver_id: selectedUser.id,
            message_type: "text",
            text_message: text,
        });

        setText("");
    };

    // ✅ Send File (AND TEXT TOGETHER ✅)
    const handleSendFile = async () => {
        if (!file || !selectedUser) return;

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await api.post("/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
        });

        const msgType = getMessageType(file);

        // ✅ Send both text + file in same message
        socket.emit("sendMessage", {
            sender_id: me.id,
            receiver_id: selectedUser.id,
            message_type: msgType,
            text_message: text.trim() ? text : null, // ✅ include optional text
            file_url: api.defaults.baseURL + uploadRes.data.file_url,
            file_name: uploadRes.data.file_name,
            file_size: uploadRes.data.file_size,
        });

        setText("");
        setFile(null);
    };

    // ✅ Forward any message/file
    const handleForward = async (msg) => {
        const toUserId = prompt("Enter receiver user ID to forward:");
        if (!toUserId) return;

        socket.emit("sendMessage", {
            sender_id: me.id,
            receiver_id: Number(toUserId),
            message_type: msg.message_type,
            text_message: msg.text_message || null,
            file_url: msg.file_url || null,
            file_name: msg.file_name || null,
            file_size: msg.file_size || null,
        });

        alert("Forwarded ✅");
    };

    return (
        <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div
                style={{
                    padding: 15,
                    borderBottom: "1px solid #ddd",
                    background: "white",
                    fontWeight: "bold",
                }}
            >
                {selectedUser ? `Chat with ${selectedUser.name}` : "Select a user"}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: 15, overflowY: "auto", background: "#ece5dd" }}>
                {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} myId={me.id} onForward={handleForward} />
                ))}
                <div ref={messageEndRef} />
            </div>

            {/* Footer */}
            <div style={{ padding: 10, background: "#f1f1f1" }}>
                <FilePreview file={file} onRemove={() => setFile(null)} />

                {/* Input */}
                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type message..."
                        style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 8,
                            border: "1px solid #ccc",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendText();
                        }}
                    />

                    <button
                        onClick={handleSendText}
                        style={{
                            padding: "12px 16px",
                            borderRadius: 8,
                            background: "#198754",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Send
                    </button>
                </div>

                {/* File input */}
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} />

                    <button
                        onClick={handleSendFile}
                        disabled={!file}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 8,
                            background: file ? "#0d6efd" : "#999",
                            color: "white",
                            border: "none",
                            cursor: file ? "pointer" : "not-allowed",
                        }}
                    >
                        Send File
                    </button>
                </div>
            </div>
        </div>
    );
}
