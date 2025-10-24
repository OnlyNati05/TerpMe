import axios from "axios";
import { API_URL } from "./config";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const uid = localStorage.getItem("uid");
  if (uid) {
    config.headers["x-user-token"] = uid;
  }
  return config;
});

export default api;
