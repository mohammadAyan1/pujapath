import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../socket/socket";

export default function VoiceCallModal({
    isOpen,
    onClose,
    myUserId,

    // ✅ Caller mode
    receiverUserId,
    receiverName = "User",

    // ✅ Receiver mode
    incomingCall = null,
}) {
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const ringRef = useRef(null);
    const timeoutRef = useRef(null);

    const [status, setStatus] = useState("idle"); // idle | calling | incoming | connected
    const [roomId, setRoomId] = useState("");

    const iceServers = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const stopRingtone = () => {
        if (ringRef.current) {
            ringRef.current.pause();
            ringRef.current.currentTime = 0;
        }
    };

    const playRingtone = () => {
        if (ringRef.current) {
            ringRef.current.play().catch(() => { });
        }
    };

    const cleanup = () => {
        stopRingtone();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        try {
            if (pcRef.current) pcRef.current.close();
            pcRef.current = null;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop());
                localStreamRef.current = null;
            }

            setStatus("idle");
            setRoomId("");
        } catch (e) {
            console.log(e);
        }
    };

    const createPeerConnection = (toUserId) => {
        const pc = new RTCPeerConnection(iceServers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("webrtc:ice", {
                    toUserId,
                    roomId,
                    candidate: event.candidate,
                });
            }
        };

        // ✅ Remote audio stream
        pc.ontrack = (event) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];

                // ✅ AUTOPLAY FIX (IMPORTANT)
                remoteAudioRef.current.play().catch(() => { });
            }
        };

        return pc;
    };

    // ✅ Caller start call
    const startOutgoingCall = () => {
        if (!receiverUserId) return;

        const newRoom = `${myUserId}-${receiverUserId}-${Date.now()}`;
        setRoomId(newRoom);
        setStatus("calling");

        socket.emit("call:request", {
            fromUserId: myUserId,
            toUserId: receiverUserId,
            roomId: newRoom,
            callType: "audio",
        });

        // ✅ auto stop if no answer in 30 seconds
        timeoutRef.current = setTimeout(() => {
            alert("No answer (timeout)");
            cleanup();
            onClose?.();
        }, 30000);
    };

    // ✅ Receiver accept
    const acceptIncomingCall = async () => {
        try {
            if (!incomingCall?.fromUserId || !incomingCall?.roomId) return;

            stopRingtone();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            setRoomId(incomingCall.roomId);
            setStatus("connected");

            socket.emit("call:accept", {
                fromUserId: incomingCall.fromUserId,
                toUserId: myUserId,
                roomId: incomingCall.roomId,
            });

            // ✅ MIC STREAM
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            const pc = createPeerConnection(incomingCall.fromUserId);
            pcRef.current = pc;

            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        } catch (err) {
            console.log(err);
            alert("Mic permission denied!");
        }
    };

    // ✅ Receiver reject
    const rejectIncomingCall = () => {
        if (!incomingCall?.fromUserId || !incomingCall?.roomId) return;

        socket.emit("call:reject", {
            fromUserId: incomingCall.fromUserId,
            roomId: incomingCall.roomId,
        });

        cleanup();
        onClose?.();
    };

    // ✅ End call
    const endCall = () => {
        const toUserId = incomingCall?.fromUserId || receiverUserId;

        if (toUserId && roomId) {
            socket.emit("call:end", { toUserId, roomId });
        }

        cleanup();
        onClose?.();
    };

    // ✅ When modal open
    useEffect(() => {
        if (!isOpen) return;

        // ✅ Receiver mode
        if (incomingCall?.roomId) {
            setRoomId(incomingCall.roomId);
            setStatus("incoming");
            playRingtone();

            // ✅ auto reject after 30 sec if not accepted
            timeoutRef.current = setTimeout(() => {
                rejectIncomingCall();
            }, 30000);
            return;
        }

        // ✅ Caller mode
        if (!incomingCall && receiverUserId && myUserId) {
            startOutgoingCall();
        }
    }, [isOpen]);

    // ✅ WebRTC Events
    useEffect(() => {
        if (!isOpen) return;

        const onAccepted = async ({ roomId }) => {
            try {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setStatus("connected");

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;

                const pc = createPeerConnection(receiverUserId);
                pcRef.current = pc;

                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("webrtc:offer", {
                    toUserId: receiverUserId,
                    roomId,
                    offer,
                });
            } catch (err) {
                console.log(err);
                alert("Mic permission denied!");
            }
        };

        const onRejected = () => {
            alert("Call rejected");
            cleanup();
            onClose?.();
        };

        const onOffer = async ({ offer }) => {
            try {
                if (!incomingCall?.fromUserId) return;

                await pcRef.current.setRemoteDescription(offer);

                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);

                socket.emit("webrtc:answer", {
                    toUserId: incomingCall.fromUserId,
                    roomId,
                    answer,
                });
            } catch (err) {
                console.log("Offer error:", err);
            }
        };

        const onAnswer = async ({ answer }) => {
            try {
                if (pcRef.current) {
                    await pcRef.current.setRemoteDescription(answer);
                }
            } catch (err) {
                console.log("Answer error:", err);
            }
        };

        const onIce = async ({ candidate }) => {
            try {
                if (pcRef.current && candidate) {
                    await pcRef.current.addIceCandidate(candidate);
                }
            } catch (err) {
                console.log("ICE error:", err);
            }
        };

        const onCallEnd = () => {
            cleanup();
            onClose?.();
        };

        socket.on("call:accepted", onAccepted);
        socket.on("call:rejected", onRejected);
        socket.on("webrtc:offer", onOffer);
        socket.on("webrtc:answer", onAnswer);
        socket.on("webrtc:ice", onIce);
        socket.on("call:end", onCallEnd);

        return () => {
            socket.off("call:accepted", onAccepted);
            socket.off("call:rejected", onRejected);
            socket.off("webrtc:offer", onOffer);
            socket.off("webrtc:answer", onAnswer);
            socket.off("webrtc:ice", onIce);
            socket.off("call:end", onCallEnd);
        };
    }, [isOpen, receiverUserId, incomingCall, roomId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4">
            {/* ✅ ringtone */}
            <audio ref={ringRef} src="/ringtone.mp3" loop />

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {incomingCall ? "Incoming Call" : "Calling"}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {incomingCall
                                ? `From: ${receiverName}`
                                : `To: ${receiverName}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Status: <span className="font-semibold">{status}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            cleanup();
                            onClose?.();
                        }}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-5 flex gap-3">
                    {status === "incoming" ? (
                        <>
                            <button
                                onClick={acceptIncomingCall}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold"
                            >
                                Accept
                            </button>

                            <button
                                onClick={rejectIncomingCall}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold"
                            >
                                Reject
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={endCall}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold"
                        >
                            End Call
                        </button>
                    )}
                </div>

                {/* ✅ Remote audio output */}
                <audio ref={remoteAudioRef} autoPlay playsInline />
            </div>
        </div>
    );
}
