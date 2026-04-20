import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    coverage: {
      enabled: true,
      reporter: ["lcov", "text"],
      include: ["src/index.*"],
      exclude: ["src/types.ts"],
    },
    watch: false,
    globals: true,
    clearMocks: true,
    include: ["src/__tests__/*.tsx"]
  },
});
