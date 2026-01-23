import { useState, useEffect } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const OTP_EXPIRY_TIME = 300; // 5 minutes
const RESEND_TIME = 60; // 1 minute

const ResetPassword = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [expiryTimer, setExpiryTimer] = useState(OTP_EXPIRY_TIME);
  const [resendTimer, setResendTimer] = useState(RESEND_TIME);

  /* ======================
     SAFETY CHECK
  ====================== */
  useEffect(() => {
    if (!email) navigate("/login");
  }, [email, navigate]);

  /* ======================
     OTP EXPIRY TIMER
  ====================== */
  useEffect(() => {
    if (expiryTimer === 0) return;

    const interval = setInterval(() => {
      setExpiryTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimer]);

  /* ======================
     RESEND TIMER
  ====================== */
  useEffect(() => {
    if (resendTimer === 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  /* ======================
     FORMAT TIME
  ====================== */
  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  /* ======================
     RESET PASSWORD
  ====================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (expiryTimer === 0) {
      return toast.error("OTP has expired. Please resend OTP.");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        localStorage.removeItem("resetEmail");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RESEND OTP
  ====================== */
  const handleResend = async () => {
    try {
      const res = await api.post("/auth/forgot-password", { email });

      if (res.data.success) {
        toast.success(res?.data?.message);

        setOtp("");
        setExpiryTimer(OTP_EXPIRY_TIME);
        setResendTimer(RESEND_TIME);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-2">
          Reset Password
        </h2>

        <p className="text-sm text-center text-gray-600 mb-2">
          OTP sent to <b>{email}</b>
        </p>

        <p className="text-sm text-center text-red-500 mb-4">
          OTP expires in <b>{formatTime(expiryTimer)}</b>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded"
          />

          <button
            type="submit"
            disabled={loading || expiryTimer === 0}
            className={`w-full py-2 rounded text-white ${
              loading || expiryTimer === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {expiryTimer === 0
              ? "OTP Expired"
              : loading
                ? "Resetting..."
                : "Reset Password"}
          </button>
        </form>

        {/* RESEND OTP */}
        <div className="text-center mt-4">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend OTP in <b>{resendTimer}s</b>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-orange-600 hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
