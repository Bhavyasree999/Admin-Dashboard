const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}`);
  }
  return data;
};

export const authAPI = {
  login: async (credentials) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(res);
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  },
  logout: () => localStorage.removeItem("token"),
};

export const analyticsAPI = {
  getMetrics: async () => {
    const res = await fetch(`${API_URL}/analytics/metrics`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },
  getCharts: async () => {
    const res = await fetch(`${API_URL}/analytics/charts`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },
};

export const userAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },
  update: async (id, body) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },
};
