import { defineConfig } from "vite";

export default defineConfig({
  base: "/game-of-life-knot/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        webgpu: "webgpu/index.html",
        old: "old/index.html",
      },
    },
  },
});
