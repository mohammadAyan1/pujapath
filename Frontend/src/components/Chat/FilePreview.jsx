export default function FilePreview({ file, onRemove }) {
    if (!file) return null;

    return (
        <div
            style={{
                padding: 10,
                background: "#fff3cd",
                border: "1px solid #ffeeba",
                borderRadius: 10,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div>
                <b>File Selected:</b> {file.name}
            </div>
            <button
                onClick={onRemove}
                style={{
                    background: "red",
                    color: "white",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                }}
            >
                ✖
            </button>
        </div>
    );
}
