// api/shiprocket/track-order.js
// GET ?awb=1234567890
// -> { found, currentStatus, lastUpdate, estimatedDelivery, courier, awb, activities[] }
//
// ---------------------------------------------------------------------
// TESTING MODE
// ---------------------------------------------------------------------
// When SHIPROCKET_TEST_MODE=true (same flag used in create-order.js),
// any AWB starting with "TESTAWB" is recognized as a mock order and
// returns a fake tracking timeline instead of calling the real
// Shiprocket API (which would just say "not found" for a fake AWB).
// Real AWBs still go through the normal Shiprocket lookup even in
// test mode, in case you want to track a real shipment while testing.
// ---------------------------------------------------------------------

const { shiprocketFetch, setCors } = require("./_client");

const TEST_MODE = process.env.SHIPROCKET_TEST_MODE === "true";

function buildMockTracking(awb) {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0, 19).replace("T", " ");

  const daysAgo = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return fmt(d);
  };

  // Fake but realistic-looking activity timeline, most recent first.
  const activities = [
    { date: daysAgo(0), status: "Out for Delivery", location: "Local Hub (mock)" },
    { date: daysAgo(1), status: "Reached Destination Hub", location: "Pune Hub (mock)" },
    { date: daysAgo(2), status: "In Transit", location: "Mumbai Hub (mock)" },
    { date: daysAgo(3), status: "Shipment Picked Up", location: "Hinjewadi, Pune (mock)" },
    { date: daysAgo(3), status: "Shipment Created", location: "Hinjewadi, Pune (mock)" },
  ];

  return {
    found: true,
    currentStatus: "Out for Delivery (Test Mode)",
    lastUpdate: activities[0].date,
    estimatedDelivery: fmt(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    courier: "Test Courier (mock)",
    awb,
    activities,
  };
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { awb } = req.query || {};

  if (!awb) {
    return res.status(400).json({ error: "AWB number required" });
  }

  // ---------------- TEST MODE: short-circuit for mock AWBs ----------------
  if (TEST_MODE && String(awb).startsWith("TESTAWB")) {
    console.log("[track-order] TEST_MODE active — returning mock tracking for", awb);
    return res.status(200).json(buildMockTracking(awb));
  }

  // ---------------- REAL MODE: actual Shiprocket tracking lookup ----------------
  try {
    const data = await shiprocketFetch(`/courier/track/awb/${awb}`, { method: "GET" });

    const trackData = data?.tracking_data;

    if (!trackData || !trackData.track_status) {
      return res.status(200).json({
        found: false,
        message: "Tracking info not available yet. Check back soon.",
      });
    }

    const activities = (trackData.shipment_track_activities || []).map((a) => ({
      date: a.date,
      status: a.status,
      location: a.location,
    }));

    return res.status(200).json({
      found: true,
      currentStatus:
        trackData.shipment_track?.[0]?.current_status || trackData.track_status_label || "In Progress",
      lastUpdate: activities[0]?.date || null,
      estimatedDelivery: trackData.etd || null,
      courier: trackData.shipment_track?.[0]?.courier_name || null,
      awb,
      activities,
    });
  } catch (err) {
    console.error("track-order error:", err.message);
    return res.status(500).json({ error: "Could not fetch tracking info" });
  }
};