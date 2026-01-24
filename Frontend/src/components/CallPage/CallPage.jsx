import VoiceCallModal from "../VoiceCallModal/VoiceCallModal.jsx";

export default function CallPage() {
    const myUserId = 1; // ✅ from login user

    return (
        <div className="p-6">
            <VoiceCallModal myUserId={myUserId} />
        </div>
    );
}
