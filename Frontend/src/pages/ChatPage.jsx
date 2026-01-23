import { useEffect, useState } from "react";
import api from "../api/axios";
import ChatSidebar from "../components/Chat/ChatSidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import { socket } from "../socket/socket";

export default function ChatPage() {
    const [me, setMe] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // ✅ unread count per userId
    const [unreadCounts, setUnreadCounts] = useState({});

    const fetchAuthenticateUser = async () => {
        const res = await api.get("/auth/checkUserLogin");
        setMe(res?.data?.data);
    };

    const loadUsers = async () => {
        const res = await api.get("/user");
        const allUsers = res.data?.data || res.data;
        setUsers(allUsers || []);
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        localStorage.setItem("selectedChatUser", JSON.stringify(user));

        // ✅ clear unread count when open that chat
        setUnreadCounts((prev) => ({
            ...prev,
            [user.id]: 0,
        }));
    };

    useEffect(() => {
        fetchAuthenticateUser();
    }, []);

    useEffect(() => {
        if (me) loadUsers();
    }, [me]);

    // ✅ restore selected user after refresh
    useEffect(() => {
        if (!me || users.length === 0) return;

        const stored = localStorage.getItem("selectedChatUser");
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const found = users.find((u) => u.id === parsed.id);
        if (found) setSelectedUser(found);
    }, [me, users]);

    // ✅ join socket and update unread badge
    useEffect(() => {
        if (!me?.id) return;

        socket.emit("join", me.id);

        const handleReceiveMessage = (msg) => {
            // if message is coming to me
            if (msg.receiver_id === me.id) {
                // if chat window not open with that sender → increment badge
                if (!selectedUser || selectedUser.id !== msg.sender_id) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
                    }));
                }
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [me, selectedUser]);

    return (
        <div style={{ display: "flex" }}>
            <ChatSidebar
                me={me}
                users={users.filter((u) => u.id !== me?.id)}
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
                unreadCounts={unreadCounts}
            />

            {me && selectedUser ? (
                <ChatWindow me={me} selectedUser={selectedUser} />
            ) : (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <h2>Select a user to start chat</h2>
                </div>
            )}
        </div>
    );
}
