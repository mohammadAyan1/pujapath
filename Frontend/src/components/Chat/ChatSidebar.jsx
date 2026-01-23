import { useMemo, useState } from "react";

export default function ChatSidebar({
    me,
    users,
    selectedUser,
    onSelectUser,
    unreadCounts = {},
}) {
    const [search, setSearch] = useState("");

    const filteredUsers = useMemo(() => {
        return users.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    return (
        <div
            style={{
                width: 320,
                borderRight: "1px solid #ddd",
                height: "100vh",
                padding: 12,
                background: "#f8f9fa",
            }}
        >
            <h3 style={{ margin: "10px 0" }}>💬 Chat</h3>

            <div style={{ fontSize: 13, marginBottom: 10 }}>
                Logged in as: <b>{me?.name}</b>
            </div>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user..."
                style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    marginBottom: 12,
                }}
            />

            <div style={{ fontWeight: "bold", marginBottom: 6 }}>Users</div>

            <div style={{ overflowY: "auto", height: "85vh" }}>
                {filteredUsers.map((u) => {
                    const unread = unreadCounts[u.id] || 0;

                    return (
                        <div
                            key={u.id}
                            onClick={() => onSelectUser(u)}
                            style={{
                                padding: 10,
                                background: selectedUser?.id === u.id ? "#e9ecef" : "white",
                                marginBottom: 8,
                                borderRadius: 10,
                                cursor: "pointer",
                                border: "1px solid #eee",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: "bold" }}>{u.name}</div>
                                <div style={{ fontSize: 12, color: "#666" }}>{u.email}</div>
                            </div>

                            {unread > 0 && (
                                <div
                                    style={{
                                        minWidth: 22,
                                        height: 22,
                                        borderRadius: 999,
                                        background: "#25D366",
                                        color: "#fff",
                                        fontSize: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "0 6px",
                                    }}
                                >
                                    {unread}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
