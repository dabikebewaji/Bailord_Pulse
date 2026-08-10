import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050/api", // your backend base URL
});

// Optionally attach token to every request automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
