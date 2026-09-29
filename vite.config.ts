import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Ensure this perfectly matches the name of your GitHub repository
  base: "/Interactive-tool-T-Winning-Spaces-2035-React/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
  },
});