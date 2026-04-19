import { defineConfig } from "vite";

const backendUrl = process.env.VITE_BACKEND_PROXY_TARGET || "http://localhost:3000";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": backendUrl,
      "/images": backendUrl
    }
  }
});
