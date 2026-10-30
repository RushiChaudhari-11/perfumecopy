// api/shiprocket/check-delivery.js
// POST { pincode: "411001", cod: true|false }
// -> { available, estimatedDays, courier, codAvailable, rate }

const { shiprocketFetch, setCors } = require("./_client");

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pincode, cod } = req.body || {};

  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
    return res.status(400).json({ error: "Enter a valid 6-digit pincode" });
  }

  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE;
  if (!pickupPincode) {
    return res.status(500).json({ error: "Server misconfigured: pickup pincode missing" });
  }

  try {
    const data = await shiprocketFetch(
      `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&cod=${
        cod ? 1 : 0
      }&weight=0.5`,
      { method: "GET" }
    );

    const couriers = data?.data?.available_courier_companies || [];

    if (!couriers.length) {
      return res.status(200).json({ available: false });
    }

    // Prefer Shiprocket's recommended courier; fall back to the cheapest.
    const best =
      couriers.find((c) => c.is_recommended) ||
      [...couriers].sort((a, b) => (a.rate || 0) - (b.rate || 0))[0];

    return res.status(200).json({
      available: true,
      estimatedDays: best.estimated_delivery_days || best.etd || "3-5",
      courier: best.courier_name,
      codAvailable: Boolean(best.cod),
      rate: best.rate,
    });
  } catch (err) {
    console.error("check-delivery error:", err.message);
    return res.status(500).json({ error: "Could not check delivery availability right now" });
  }
};