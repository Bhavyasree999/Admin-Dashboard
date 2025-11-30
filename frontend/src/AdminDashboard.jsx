// src/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  UserPlus,
  LogOut,
  Menu,
  X,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { authAPI, userAPI, analyticsAPI } from "./services/api";

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search + filter for users tab
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Load dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. metrics
      const metricsResponse = await analyticsAPI.getMetrics();
      const {
        totalUsers = 0,
        newSignups = 0,
        totalSales = 0,
        growthRate = 0,
      } = metricsResponse || {};

      setMetrics([
        {
          title: "Total Users",
          value: totalUsers.toLocaleString("en-IN"),
          change: "+12%",
          icon: Users,
          color: "bg-blue-500",
        },
        {
          title: "New Sign-ups",
          value: newSignups.toLocaleString("en-IN"),
          change: "+8%",
          icon: UserPlus,
          color: "bg-green-500",
        },
        {
          title: "Total Sales",
          value: `₹${totalSales.toLocaleString("en-IN")}`,
          change: "+15%",
          icon: DollarSign,
          color: "bg-purple-500",
        },
        {
          title: "Growth Rate",
          value: `${growthRate}%`,
          change: "+5%",
          icon: TrendingUp,
          color: "bg-orange-500",
        },
      ]);

      // 2. charts
      const chartsResponse = await analyticsAPI.getCharts();
      setChartData(Array.isArray(chartsResponse) ? chartsResponse : []);

      // 3. users
      const usersResponse = await userAPI.getAll();
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);

      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);

      const response = await authAPI.login(credentials);
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Use admin@example.com / admin123");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout?.();
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setMetrics([]);
    setChartData([]);
    setCredentials({ email: "", password: "" });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userAPI.delete(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const user = users.find((u) => u._id === id);
      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      await userAPI.update(id, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update user status.");
    }
  };

  // ---------- demo data buttons ----------
  const generateSampleUsers = async () => {
    try {
      const count = 10;
      for (let i = 1; i <= count; i++) {
        await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `User ${Date.now()}-${i}`,
            email: `user${Date.now()}-${i}@example.com`,
            password: "user123",
            role: "User",
          }),
        });
      }
      alert(`${count} sample users created!`);
      loadDashboardData();
    } catch (err) {
      console.error("Error creating sample users:", err);
      alert("Failed to create sample users.");
    }
  };

  const generateSampleAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in again.");
        return;
      }

      const sampleAnalytics = [
        { activeUsers: 300, newSignups: 40, sales: 9000, revenue: 75000 },
        { activeUsers: 420, newSignups: 65, sales: 12000, revenue: 95000 },
        { activeUsers: 500, newSignups: 80, sales: 15000, revenue: 125000 },
        { activeUsers: 650, newSignups: 120, sales: 22000, revenue: 200000 },
      ];

      for (const entry of sampleAnalytics) {
        await fetch("http://localhost:5000/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entry),
        });
      }

      alert("Analytics data generated!");
      loadDashboardData();
    } catch (err) {
      console.error("Error generating analytics:", err);
      alert("Failed to generate analytics.");
    }
  };

  // ---------- data for pie chart ----------
  const activeCount = users.filter((u) => u.status === "Active").length;
  const inactiveCount = users.filter((u) => u.status === "Inactive").length;

  const userTypeData = [
    { name: "Active", value: activeCount, color: "#10b981" },
    { name: "Inactive", value: inactiveCount, color: "#ef4444" },
  ];

  // ---------- filtered users for table ----------
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ? true : user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ---------- login screen ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="admin123"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Use: <strong>admin@example.com</strong> /{" "}
              <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- loading full dashboard ----------
  if (loading && !users.length && !metrics.length && !chartData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // NOTE: main layout uses h-screen + overflow-hidden so sidebar stays fixed
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-indigo-900 text-white transition-all duration-300 flex flex-col h-full flex-shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-indigo-800">
          {sidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-indigo-800 rounded transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition ${
              activeTab === "dashboard"
                ? "bg-indigo-800"
                : "hover:bg-indigo-800"
            }`}
          >
            <TrendingUp size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition ${
              activeTab === "users" ? "bg-indigo-800" : "hover:bg-indigo-800"
            }`}
          >
            <Users size={20} />
            {sidebarOpen && <span>User Management</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-800 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content (scrolls independently) */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === "dashboard" ? "Dashboard Overview" : "User Management"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                {currentUser?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-600">
                {currentUser?.role || "Administrator"}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser?.name?.charAt(0) || "A"}
            </div>
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="p-6">
            {/* Sample data buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
              <button
                onClick={generateSampleUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
              >
                <span>➕</span> Generate Sample Users
              </button>
              <button
                onClick={generateSampleAnalytics}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center gap-2"
              >
                <span>📊</span> Generate Sample Analytics
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`${metric.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                    >
                      <metric.icon className="text-white" size={24} />
                    </div>
                    <span className="text-green-600 text-sm font-semibold">
                      {metric.change}
                    </span>
                  </div>
                  <h3 className="text-gray-600 text-sm mb-1">
                    {metric.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-800">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Line chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sales & Users Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Sales"
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  User Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Monthly Revenue
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* search + filter bar */}
              <div className="p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Join Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                              {user.name?.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-800">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === "Admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.joinDate
                            ? new Date(user.joinDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              className="p-2 hover:bg-blue-50 rounded-lg transition"
                              title="View"
                              onClick={() =>
                                alert(
                                  `User: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`
                                )
                              }
                            >
                              <Eye size={18} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user._id)}
                              className="p-2 hover:bg-green-50 rounded-lg transition"
                              title="Toggle Status"
                            >
                              <Edit size={18} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredUsers.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No users match your search/filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
