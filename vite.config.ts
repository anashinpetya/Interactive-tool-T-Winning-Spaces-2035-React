import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work from any sub-path
// (e.g. https://<user>.github.io/<repo>/) without extra configuration.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
