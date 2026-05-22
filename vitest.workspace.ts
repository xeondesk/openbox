import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "web",
      root: "./apps/web",
      include: ["**/*.test.ts", "**/*.test.tsx"],
      environment: "node",
    },
  },
  {
    test: {
      name: "packages",
      include: ["packages/*/lib/**/*.test.ts", "packages/*/lib/**/*.test.tsx"],
      environment: "node",
    },
  },
]);
