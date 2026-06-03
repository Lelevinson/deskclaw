import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  // We import ../src/shop, so file tracing must root at the repo, not web/. This
  // also silences the multi-lockfile workspace-root inference warning.
  outputFileTracingRoot: repoRoot,
  // The src/shop service is authored as NodeNext ESM: its relative imports carry
  // explicit ".js" specifiers that actually point at ".ts" sources. Teach the
  // bundler to resolve ".js" → ".ts" so we can import the real TypeScript service
  // directly (single source of truth, no separate build step). See web/README.md.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
