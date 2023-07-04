import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    coverage: {
      reporter: ["lcov", "text"]
    },
    watch: false,
    globals: true,
    clearMocks: true,
    environment: "jsdom",
    transformMode: {
      web: [/\.[jt]sx?$/]
    },
    include: "src/__tests__/*.tsx",
    deps: { registerNodeLoader: false }
  },
  resolve: {
    conditions: ["browser", "development"]
  }
});
