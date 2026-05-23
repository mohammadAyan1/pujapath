import React, { useState } from 'react'
import api from '../../api/axios'
import { faEyeSlash, faEye, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";

const Register = () => {

    const [open, setOpen] = useState(false);      // modal open/close
    const [showPwd, setShowPwd] = useState(false); // password eye


    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: "",
        password: ""
    });

    const handleRegisteUser = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/admin/register", form)
            toast.success(res?.data?.message);
            setOpen(false)
        } catch (error) {
            const message =
                error?.response?.data?.message || "Something went wrong";
            toast.error(message);
        }

    };

    return (
        <>
            {/* 🔘 OPEN MODAL BUTTON */}
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Open Register
            </button>

            {/* 🧱 MODAL */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

                    {/* Modal Box */}
                    <div className="bg-white w-[400px] rounded-lg p-6 relative">

                        {/* ❌ Close */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute right-3 top-3 text-gray-500"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>

                        <h2 className="text-xl font-semibold mb-4">Register</h2>

                        <form onSubmit={handleRegisteUser} className="space-y-3">
                            <div>
                                <label>User</label>
                                <input
                                    name="name"
                                    className="w-full border p-2"
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label>Phone</label>
                                <input
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    }}
                                    name="mobile"
                                    type='tel'
                                    className="w-full border p-2"
                                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                />
                            </div>

                            <div>
                                <label>Email</label>
                                <input
                                    name="email"
                                    className="w-full border p-2"
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            {/* 👁️ PASSWORD WITH EYE */}
                            <div className="relative">
                                <label>Password</label>
                                <input
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    className="w-full border p-2 pr-10"
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />

                                <FontAwesomeIcon
                                    icon={showPwd ? faEyeSlash : faEye}
                                    className="absolute right-3 top-9 cursor-pointer text-gray-500"
                                    onClick={() => setShowPwd(!showPwd)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 rounded"
                            >
                                Submit
                            </button>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Register;
