import { defineConfig } from "vite";

const deploymentBase = process.env.BASE_PATH;

export default defineConfig({
  // CreatorCode publishes under /projects/{user}/{project}/{version}/.
  // Local development continues to use the site root.
  base: deploymentBase ? `${deploymentBase.replace(/\/+$/, "")}/` : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          renderer: ["three", "three/addons/controls/OrbitControls.js"],
          react: ["react", "react-dom/client"],
        },
      },
    },
  },
});
