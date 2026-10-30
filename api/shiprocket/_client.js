// api/shiprocket/_client.js
// Shared helper — never import this into React. Server-only.
// Handles: Shiprocket login/token caching, authenticated requests, CORS.

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// Module-level cache. Persists across requests as long as the serverless
// function instance stays warm (Vercel keeps functions warm for a few
// minutes between calls), so most requests skip the login round-trip.
let cachedToken = null;
let cachedTokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD env vars."
    );
  }

  const resp = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data.token) {
    throw new Error(data.message || "Shiprocket login failed");
  }

  cachedToken = data.token;
  // Shiprocket tokens are valid ~10 days. Refresh a day early to be safe.
  cachedTokenExpiry = now + 9 * 24 * 60 * 60 * 1000;

  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();

  const resp = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const err = new Error(data.message || `Shiprocket API error (${resp.status})`);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  return data;
}

function setCors(res) {
  // If your frontend is deployed on the SAME Vercel project as these
  // functions, this isn't even needed (same-origin). Kept here so this
  // still works if the React app is hosted elsewhere (e.g. Firebase
  // Hosting) and calls these functions cross-origin.
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = { getToken, shiprocketFetch, setCors, BASE_URL };