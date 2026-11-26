// Copies MediaPipe's WebAssembly files into public/ so the AI coach can run pose
// tracking in the browser without a third-party CDN. Runs before `dev` and `build`.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// The package does not export package.json, so find its folder from its main file.
const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve("@mediapipe/tasks-vision")), "wasm");
const out = join(import.meta.dirname, "..", "public", "mediapipe", "wasm");
mkdirSync(out, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) {
  const a = join(src, f), b = join(out, f);
  if (!existsSync(b) || statSync(b).size !== statSync(a).size) copyFileSync(a, b);
}
