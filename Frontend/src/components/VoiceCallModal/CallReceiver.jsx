import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext/AuthContext";
import VoiceCallModal from "./VoiceCallModal";
import { socket } from "../../socket/socket";
import api from "../../api/axios";

export default function CallReceiver() {
    const { user } = useAuth();

    const [open, setOpen] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null); // {fromUserId, roomId, callType}
    const [callerName, setCallerName] = useState("Unknown");

    useEffect(() => {
        if (!user?.id) return;

        const handleIncoming = async ({ fromUserId, roomId, callType }) => {
            console.log("📞 Incoming call:", { fromUserId, roomId, callType });

            setIncomingCall({ fromUserId, roomId, callType });
            setOpen(true);

            // ✅ fetch caller name (optional)
            try {
                const res = await api.get(`/user/${fromUserId}`);
                setCallerName(res?.data?.data?.name || "Unknown");
            } catch (err) {
                setCallerName("Unknown");
            }
        };

        socket.on("call:incoming", handleIncoming);

        return () => {
            socket.off("call:incoming", handleIncoming);
        };
    }, [user?.id]);

    if (!user?.id) return null;

    return (
        <VoiceCallModal
            isOpen={open}
            onClose={() => {
                setOpen(false);
                setIncomingCall(null);
                setCallerName("Unknown");
            }}
            myUserId={user.id}
            incomingCall={incomingCall}
            receiverName={callerName}
        />
    );
}
