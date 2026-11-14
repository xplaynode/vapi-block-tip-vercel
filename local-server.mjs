// LOCAL TEST HARNESS ONLY — not deployed (excluded via .vercelignore).
// Serves the exact same Hono app from api/index.js under Node for local verification.
import { serve } from "@hono/node-server";
import { app } from "./api/index.js";

serve({ fetch: app.fetch, port: 4399 });
console.log("Base Block Tip (local harness) listening on :4399");
