import { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext";
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeBtn, setActiveBtn] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
  });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const replaceQuestIdWithUserId = async (guestId) => {
    try {
      const res = await api.put(`/product-addtocard/replace/${guestId}`);
      console.log("Replace Response:", res?.data);
      if (res?.data?.success) {
        localStorage.clear();
      }
    } catch (error) {
      console.log("Replace Error:", error?.response?.data || error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setActiveBtn(true);
      if (isLogin) {
        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });



        if (res?.data?.success) {
          toast.success(res?.data?.message);

          const getGuestIdFromLocalStorage = localStorage.getItem("guestId")
          if (getGuestIdFromLocalStorage) {
            replaceQuestIdWithUserId(getGuestIdFromLocalStorage)
          }

          setTimeout(() => navigate("/"), 1000);
        } else {
          toast.error(res?.data?.message);
        }
      } else {
        const res = await api.post("/auth/register", {
          name: formData?.name,
          email: formData?.email,
          mobile: formData?.mobile,
          password: formData?.password,
        });



        if (res?.data?.success) {
          toast.success(res?.data?.message);
          setTimeout(() => {
            navigate("/verify-email", {
              state: {
                email: res?.data?.data?.email,
              },
            });
          }, 1000);
        } else {
          toast.error(res?.data?.message);
        }
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.data?.message ||
        "Something went wrong";
      toast.error(message);
    } finally {
      setActiveBtn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-6">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (Register only) */}
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}

          {/* Mobile (Register only) */}
          {!isLogin && (
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-orange-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={activeBtn}
            className={
              !activeBtn
                ? "w-full bg-orange-500 text-white py-2 rounded-md font-semibold hover:bg-orange-600 transition"
                : "w-full bg-gray-500 text-white py-2 rounded-md font-semibold hover:cursor-not-allowed transition"
            }
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {/* Toggle Button */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-600 hover:text-orange-600 transition"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
