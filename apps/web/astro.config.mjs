import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "hybrid", // Enable API routes
  site: "https://schoolquiz.app",
  vite: {
    define: {
      "process.env": process.env
    }
  }
});
