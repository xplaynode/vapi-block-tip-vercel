import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

const app = new Hono();
const facilitator = "https://x402.org/facilitator";
const payTo = "0xecfe3D1898Cc508657Cd032F6C41f5Af0CEfbAE2";
const BASE_RPC = "https://mainnet.base.org";

const offer = {
  x402Version: 2,
  error: "Payment required",
  resource: {
    url: "/paid",
    description: "Current Base mainnet block number and timestamp, fetched live at call time.",
    mimeType: "application/json",
    serviceName: "Base Block Tip",
  },
  accepts: [{
    scheme: "exact",
    network: "eip155:8453",
    amount: "5000",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo,
    maxTimeoutSeconds: 120,
    extra: { name: "USD Coin", version: "2" },
  }],
};

app.use("*", cors({ origin: "*", exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"] }));

app.get("/", (c) => c.json({ service: "Base Block Tip", paid_endpoint: "/paid", price: "0.005 USDC on Base" }));

app.get("/openapi.json", (c) => c.json({
  openapi: "3.0.3",
  info: { title: "Base Block Tip", version: "1.0.0" },
  paths: { "/paid": { post: {
    "x-payment-info": offer.accepts[0],
    responses: { "200": { description: "Paid response" }, "402": { description: "Payment required" } },
  } } },
}));

async function baseTip() {
  const r = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", false] }),
  });
  const j = await r.json();
  const b = j.result;
  return {
    chain: "Base (eip155:8453)",
    blockNumber: parseInt(b.number, 16),
    timestamp: new Date(parseInt(b.timestamp, 16) * 1000).toISOString(),
    blockHash: b.hash,
  };
}

app.post("/paid", async (c) => {
  const encoded = c.req.header("PAYMENT-SIGNATURE");
  if (!encoded) {
    const origin = new URL(c.req.url).origin;
    const dynOffer = { ...offer, resource: { ...offer.resource, url: `${origin}/paid` } };
    return c.json(dynOffer, 402, { "PAYMENT-REQUIRED": btoa(JSON.stringify(dynOffer)) });
  }
  let payment;
  try { payment = JSON.parse(atob(encoded)); } catch { return c.json({ error: "Invalid payment" }, 400); }
  const body = { x402Version: 2, paymentPayload: payment, paymentRequirements: offer.accepts[0] };
  const headers = { "content-type": "application/json" };
  const verify = await fetch(`${facilitator}/verify`, { method: "POST", headers, body: JSON.stringify(body) });
  const verified = await verify.json();
  if (!verify.ok || !verified.isValid) return c.json({ error: "Payment verification failed" }, 402);
  const settle = await fetch(`${facilitator}/settle`, { method: "POST", headers, body: JSON.stringify(body) });
  const settlement = await settle.json();
  if (!settle.ok || !settlement.success) return c.json({ error: "Payment settlement failed" }, 502);
  const tip = await baseTip();
  return c.json({ resource: offer.resource, data: tip }, 200, { "PAYMENT-RESPONSE": btoa(JSON.stringify(settlement)) });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);

export { app };
