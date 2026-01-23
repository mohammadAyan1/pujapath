import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [openPuja, setOpenPuja] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);

  return (
    <aside
      className={`
        fixed md:static z-40
        top-0 left-0 h-full w-64 bg-gray-900 text-white p-4
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* MOBILE CLOSE BUTTON */}
      <div className="md:hidden flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button onClick={() => setSidebarOpen(false)}>
          <X size={24} />
        </button>
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/admin"
          onClick={() => setSidebarOpen(false)}
          className="block px-3 py-2 rounded hover:bg-gray-700"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/pandit"
          onClick={() => setSidebarOpen(false)}
          className="block px-3 py-2 rounded hover:bg-gray-700"
        >
          Pandit
        </NavLink>

        {/* PUJA MENU */}
        <button
          onClick={() => setOpenPuja(!openPuja)}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 flex justify-between"
        >
          Puja
          <span>{openPuja ? "−" : "+"}</span>
        </button>

        {openPuja && (
          <div className="ml-4 space-y-1">
            <NavLink
              to="/admin/puja/category"
              onClick={() => setSidebarOpen(false)}
              className="block px-3 py-1 rounded hover:bg-gray-700"
            >
              Puja Category
            </NavLink>

            <NavLink
              to="/admin/puja"
              onClick={() => setSidebarOpen(false)}
              className="block px-3 py-1 rounded hover:bg-gray-700"
            >
              Puja
            </NavLink>
          </div>
        )}

        <NavLink
          to="/admin/temple"
          onClick={() => setSidebarOpen(false)}
          className="block px-3 py-2 rounded hover:bg-gray-700"
        >
          Temple
        </NavLink>

        <button

          onClick={() => setOpenProduct(!openProduct)}
          className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 flex justify-between"
        >
          Product
          <span>{openProduct ? "−" : "+"}</span>
        </button>
        {openProduct && (
          <div className="ml-4 space-y-1">
            <NavLink
              to="/admin/product"
              onClick={() => setSidebarOpen(false)}
              className="block px-3 py-1 rounded hover:bg-gray-700"
            >
              Product
            </NavLink>

            <NavLink
              to="/admin/product/category"
              onClick={() => setSidebarOpen(false)}
              className="block px-3 py-1 rounded hover:bg-gray-700"
            >
              Product Category
            </NavLink>
          </div>
        )}

        <NavLink
          to="/admin/user"
          onClick={() => setSidebarOpen(false)}
          className="block px-3 py-2 rounded hover:bg-gray-700"
        >
          Users
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
