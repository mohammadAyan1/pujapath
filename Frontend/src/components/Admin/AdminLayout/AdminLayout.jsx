import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext/AuthContext";
import { Menu, X } from "lucide-react"; // optional icons

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user?.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        {/* MOBILE HEADER */}
        <div className="md:hidden bg-white p-3 shadow flex items-center">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="ml-3 font-semibold">Admin Panel</h2>
        </div>

        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
