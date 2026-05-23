import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSync,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import Register from "../../Register/Register";

/* ✅ Debounce Hook */
const useDebounce = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [customLimit, setCustomLimit] = useState("");

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  // ✅ Filters
  const [role, setRole] = useState("all");
  const [verified, setVerified] = useState("all");
  const [approved, setApproved] = useState("all");

  // ✅ Search
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // ✅ Abort controller to stop old API calls
  const abortRef = useRef(null);

  /* ==========================
        FETCH USERS (ONLY ONE)
  ========================== */
  const fetchAllUsers = async () => {
    // ✅ cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await api.get("/user", {
        params: {
          page,
          limit,
          search: debouncedSearch,
          role,
          verified,
          approved,
        },
        signal: controller.signal,
      });

      if (res?.data?.success) {
        setUsers(res?.data?.data || []);
        setPagination(res?.data?.pagination || { total: 0, totalPages: 1 });
      } else {
        toast.error(res?.data?.message || "Failed to fetch users");
      }
    } catch (error) {
      if (error.name === "CanceledError") return;
      if (error.name === "AbortError") return;

      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  /* ✅ SINGLE EFFECT for all fetch */
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, role, verified, approved]);

  /* ✅ Reset page when filter/search/limit changes */
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearch, role, verified, approved]);

  /* ==========================
        UPDATE LOCAL UI FIRST
  ========================== */
  const updateLocalUser = (userId, key, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, [key]: value } : u))
    );
  };

  /* ==========================
        UPDATE FUNCTIONS
  ========================== */
  const updateApproval = async (userId, newStatus) => {
    updateLocalUser(userId, "is_approved", newStatus);

    try {
      const res = await api.put(`/user/approve/${userId}`, {
        is_approved: newStatus,
      });

      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Failed to update approval");
        fetchAllUsers(); // revert by refetch
        return;
      }

      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update approval");
      fetchAllUsers();
    }
  };

  const updateVerified = async (userId, newStatus) => {
    updateLocalUser(userId, "is_verified", newStatus);

    try {
      const res = await api.put(`/user/verify/${userId}`, {
        is_verified: newStatus,
      });

      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Failed to update verified");
        fetchAllUsers();
        return;
      }

      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update verified");
      fetchAllUsers();
    }
  };

  const updateRole = async (userId, newRole) => {
    updateLocalUser(userId, "role", newRole);

    try {
      const res = await api.put(`/user/role/${userId}`, {
        role: newRole,
      });

      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Failed to update role");
        fetchAllUsers();
        return;
      }

      toast.success(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update role");
      fetchAllUsers();
    }
  };

  /* ==========================
      PAGINATION UI (1 2 3 ... last)
  ========================== */
  const paginationNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    const current = page;

    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (current < totalPages - 2) {
      return [1, "...", current - 1, current, current + 1, "...", totalPages];
    }

    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }, [pagination.totalPages, page]);

  /* ==========================
      DATE FORMAT
  ========================== */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Register />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Pagination + Filters + Role/Verify/Approve Update
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, email, mobile..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon
                  icon={faFilter}
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>

              <select
                value={verified}
                onChange={(e) => setVerified(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">All Verified</option>
                <option value="1">Verified</option>
                <option value="0">Not Verified</option>
              </select>

              <select
                value={approved}
                onChange={(e) => setApproved(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="all">All Approved</option>
                <option value="1">Approved</option>
                <option value="0">Pending</option>
              </select>

              {/* Rows per page */}
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded-lg px-3 py-2"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>

              {/* Custom rows */}
              <input
                type="number"
                placeholder="Custom"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                className="border rounded-lg px-3 py-2 w-[110px]"
                min={1}
              />
              {/* <button
                onClick={() => {
                  const val = Number(customLimit);
                  if (!val || val <= 0) return toast.error("Enter valid rows");
                  setLimit(val);
                  setCustomLimit("");
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg"
              >
                Apply
              </button> */}

              <button
                type="button"
                onClick={() => {
                  const val = Number(customLimit);

                  if (!val || val <= 0) {
                    return toast.error("Enter valid custom rows");
                  }

                  setPage(1);        // ✅ IMPORTANT
                  setLimit(val);     // ✅ Set new limit
                  setCustomLimit("");
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg"
              >
                Apply
              </button>


              {/* Refresh */}
              <button
                onClick={fetchAllUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                <FontAwesomeIcon
                  icon={faSync}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">{user.email}</div>
                        <div className="text-sm text-gray-600">{user.mobile}</div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Verified */}
                      <td className="px-6 py-4">
                        <select
                          value={user.is_verified}
                          onChange={(e) =>
                            updateVerified(user.id, Number(e.target.value))
                          }
                          className="border rounded px-2 py-1"
                        >
                          <option value={1}>Verified</option>
                          <option value={0}>Not Verified</option>
                        </select>
                      </td>

                      {/* Approved */}
                      <td className="px-6 py-4">
                        <select
                          value={user.is_approved}
                          onChange={(e) =>
                            updateApproval(user.id, Number(e.target.value))
                          }
                          className="border rounded px-2 py-1"
                        >
                          <option value={1}>Approved</option>
                          <option value={0}>Pending</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6">
          <p className="text-gray-600 text-sm">
            Page {page} of {pagination.totalPages} • Total: {pagination.total}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            {paginationNumbers.map((num, idx) =>
              num === "..." ? (
                <span key={idx} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  onClick={() => setPage(num)}
                  className={`px-3 py-1 border rounded ${page === num ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                >
                  {num}
                </button>
              )
            )}

            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
