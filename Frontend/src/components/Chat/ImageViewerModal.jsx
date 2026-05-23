import { useEffect, useState } from "react";

export default function ImageViewerModal({ open, src, onClose }) {
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (open) setZoom(1);
    }, [open]);

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 20,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "90%",
                    height: "90%",
                    background: "#111",
                    borderRadius: 12,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "8px 12px",
                        background: "red",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        zIndex: 10,
                    }}
                >
                    ✖
                </button>

                {/* Controls */}
                {/* <div
                    style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        display: "flex",
                        gap: 10,
                        zIndex: 10,
                    }}
                >
                    <button
                        onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                        style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        ➖ Zoom Out
                    </button>

                    <button
                        onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                        style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        ➕ Zoom In
                    </button>

                    <a
                        href={src}
                        download
                        style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: "#0d6efd",
                            color: "#fff",
                            textDecoration: "none",
                        }}
                    >
                        ⬇ Download
                    </a>
                </div> */}

                {/* Image */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src={src}
                        alt="preview"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "center",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            borderRadius: 8,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
