import api from "../../api/client";

const DEMO_DELIVERY_CREDENTIALS = {
  email: "delivery@gmail.com",
  password: "123",
  role: "delivery",
};

const normalizeList = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.value)) {
    return data.value;
  }

  if (Array.isArray(data?.orders)) {
    return data.orders;
  }

  return [];
};

const saveSession = (payload) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  if (payload?.token) {
    localStorage.setItem("token", payload.token);
  }

  if (payload?.user) {
    localStorage.setItem("user", JSON.stringify(payload.user));
  } else if (payload?.token) {
    localStorage.setItem("user", JSON.stringify({ role: "delivery" }));
  }
};

const authenticateDemoDeliveryUser = async () => {
  const login = await api.post("/auth/login", DEMO_DELIVERY_CREDENTIALS);

  if (!login?.data?.token) {
    throw new Error("Unable to authenticate delivery session");
  }

  saveSession(login.data);
  return login.data;
};

export const loadDeliveryList = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return normalizeList(response.data);
  } catch (error) {
    const shouldRetry = error?.response?.status === 401;

    if (!shouldRetry) {
      throw error;
    }

    await authenticateDemoDeliveryUser();
    const retry = await api.get(endpoint);
    return normalizeList(retry.data);
  }
};

export const acceptDeliveryOrder = (orderId) => api.post(`/delivery/${orderId}/accept`);

export const updateDeliveryOrderStatus = (orderId, status) =>
  api.put(`/delivery/${orderId}/status`, { status });
