// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// SPA_BUILD=1 (see `bun run build:spa`, used by the Dockerfile) emits a static client
// bundle — dist/client/index.html + assets — that nginx serves with no Node runtime.
// Safe here: the app has no server functions and talks to the REST API from the browser.
// Nitro is skipped in that mode; TanStack's SPA shell prerender needs its own dist/server
// build and fails against a nitro .output/ layout.
const spaBuild = process.env.SPA_BUILD === "1";

export default defineConfig({
  // PostgreSQL (pg) requires a Node.js Nitro preset — not Cloudflare Workers.
  nitro: spaBuild ? false : { preset: "node" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    spa: { enabled: spaBuild },
  },
});
