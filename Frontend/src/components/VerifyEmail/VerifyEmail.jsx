import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const OTP_LENGTH = 6;
const RESEND_TIME = 60; // 1 minute
const OTP_EXPIRY_TIME = 300; // 5 minutes (300 seconds)

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const email = location.state?.email;

  // 🔒 Safety check
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  if (!email) return null;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);

  const [resendTimer, setResendTimer] = useState(RESEND_TIME);
  const [expiryTimer, setExpiryTimer] = useState(OTP_EXPIRY_TIME);

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
     INPUT HANDLERS
  ====================== */
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  /* ======================
     VERIFY OTP
  ====================== */
  const handleVerify = async (e) => {
    e.preventDefault();

    if (expiryTimer === 0) {
      return toast.error("OTP has expired. Please resend.");
    }

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      return toast.error("Please enter complete OTP");
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify", {
        email,
        otp: enteredOtp,
      });

      if (res?.data?.success || res?.response?.data?.success) {
        toast.success(res?.data?.message || res?.response?.data?.message);
        navigate("/login");
      } else {
        toast.error(res?.data?.message || res?.response?.data?.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error?.data?.message ||
        "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RESEND OTP
  ====================== */
  const handleResend = async () => {
    try {
      const res = await api.post("/auth/resend", { email });

      if (res?.data?.success || res?.response?.data?.success) {
        toast.success(res?.data?.message || res?.response?.data?.message);

        // Reset everything
        setOtp(Array(OTP_LENGTH).fill(""));
        setResendTimer(RESEND_TIME);
        setExpiryTimer(OTP_EXPIRY_TIME);
        inputsRef.current[0]?.focus();
      } else {
        toast.error(res?.data?.message || res?.response?.data?.success);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  /* ======================
     FORMAT TIME (MM:SS)
  ====================== */
  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-2">
          Verify Email
        </h2>

        <p className="text-sm text-center text-gray-600 mb-2">
          Enter the 6-digit OTP sent to <b>{email}</b>
        </p>

        {/* OTP EXPIRY */}
        <p className="text-sm text-center text-red-500 mb-4">
          OTP expires in <b>{formatTime(expiryTimer)}</b>
        </p>

        <form onSubmit={handleVerify}>
          {/* OTP INPUTS */}
          <div className="flex justify-between mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center text-xl border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ))}
          </div>

          {/* VERIFY BUTTON */}
          <button
            type="submit"
            disabled={loading || expiryTimer === 0}
            className={`w-full py-2 rounded text-white font-semibold ${loading || expiryTimer === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
              }`}
          >
            {expiryTimer === 0
              ? "OTP Expired"
              : loading
                ? "Verifying..."
                : "Verify OTP"}
          </button>
        </form>

        {/* RESEND SECTION */}
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

export default VerifyEmail;
