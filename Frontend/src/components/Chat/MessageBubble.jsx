import { useState } from "react";
import { formatTime } from "../../utils/time";
import ImageViewerModal from "./ImageViewerModal";

export default function MessageBubble({ msg, myId, onForward }) {
    const isMe = msg.sender_id === myId;

    const [openViewer, setOpenViewer] = useState(false);

    const handleDownload = () => {
        if (!msg.file_url) return;
        const a = document.createElement("a");
        a.href = msg.file_url;
        a.download = msg.file_name || "download";
        a.click();
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    marginBottom: 10,
                }}
            >
                <div
                    style={{
                        maxWidth: "70%",
                        background: isMe ? "#DCF8C6" : "#fff",
                        padding: "10px",
                        borderRadius: "12px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    {/* TEXT */}
                    {msg.message_type === "text" && (
                        <div style={{ fontSize: 15 }}>{msg.text_message}</div>
                    )}

                    {/* IMAGE */}
                    {msg.message_type === "image" && (
                        <img
                            src={msg.file_url}
                            alt="chat-img"
                            style={{
                                maxWidth: "100%",
                                borderRadius: 10,
                                cursor: "pointer",
                            }}
                            onClick={() => setOpenViewer(true)}
                        />
                    )}

                    {/* VIDEO */}
                    {msg.message_type === "video" && (
                        <video
                            src={msg.file_url}
                            controls
                            style={{ width: "100%", borderRadius: 10 }}
                        />
                    )}

                    {/* DOCUMENT */}
                    {msg.message_type === "document" && (
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <a href={msg.file_url} target="_blank" rel="noreferrer">
                                📄 {msg.file_name}
                            </a>

                            <button
                                onClick={handleDownload}
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "none",
                                    cursor: "pointer",
                                    background: "#0d6efd",
                                    color: "#fff",
                                }}
                            >
                                ⬇ Download
                            </button>
                        </div>
                    )}

                    {/* Forward Button */}
                    <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 11, color: "#444" }}>
                            {formatTime(msg.created_at)}
                        </div>

                        <button
                            onClick={() => onForward(msg)}
                            style={{
                                padding: "4px 8px",
                                fontSize: 12,
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                cursor: "pointer",
                                background: "#fff",
                            }}
                        >
                            ↗ Forward
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen image viewer */}
            <ImageViewerModal
                open={openViewer}
                src={msg.file_url}
                onClose={() => setOpenViewer(false)}
            />
        </>
    );
}
