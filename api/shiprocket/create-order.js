// api/shiprocket/create-order.js
// POST { orderId, customer, items, total, subtotal, paymentMethod }
// -> { success, shiprocketOrderId, shipmentId, awbCode, courier, estimatedDelivery, trackingUrl, shipmentStatus }
//
// This does NOT touch Firestore. The React app already saved the order
// there — it just merges these fields into that same doc after calling
// this endpoint. Keeps this function stateless and credential-only.
//
// ---------------------------------------------------------------------
// TESTING MODE
// ---------------------------------------------------------------------
// Set SHIPROCKET_TEST_MODE=true in your Vercel env vars (Development /
// Preview only — NEVER set this in Production) to skip the real
// Shiprocket API entirely and return a fake success response instead.
// No real order, shipment, or courier assignment happens in this mode.
// ---------------------------------------------------------------------

const { shiprocketFetch, setCors } = require("./_client");

const TEST_MODE = process.env.SHIPROCKET_TEST_MODE === "true";

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, customer, items, total, subtotal, paymentMethod } = req.body || {};

  if (!orderId || !customer || !items || !items.length) {
    return res.status(400).json({ error: "Missing required order fields" });
  }

  // ---------------- TEST MODE: short-circuit before touching Shiprocket ----------------
  if (TEST_MODE) {
    console.log("[create-order] TEST_MODE active — skipping real Shiprocket call for order", orderId);
    return res.status(200).json({
      success: true,
      shiprocketOrderId: `TEST-${orderId}`,
      shipmentId: `TEST-SHIP-${orderId}`,
      awbCode: "TESTAWB000000",
      courier: "Test Courier (mock)",
      estimatedDelivery: "3-5 days (mock)",
      trackingUrl: null,
      shipmentStatus: "Shipment Created (Test Mode)",
    });
  }

  // ---------------- REAL MODE: actual Shiprocket order + AWB assignment ----------------
  try {
    const nameParts = (customer.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || ".";

    const orderDate = new Date().toISOString().slice(0, 16).replace("T", " ");

    const payload = {
      order_id: String(orderId),
      order_date: orderDate,
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: customer.address1,
      billing_address_2: customer.address2 || "",
      billing_city: customer.city,
      billing_pincode: customer.postal,
      billing_state: customer.state,
      billing_country: customer.country || "India",
      billing_email: customer.email,
      billing_phone: String(customer.phone || "").replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: items.map((it) => ({
        name: it.name,
        sku: String(it.id || it.uniqueId || it.name).slice(0, 50),
        units: it.qty || 1,
        selling_price: it.price ? it.price / 100 : 0, // paise -> rupees, adjust if you already store rupees
      })),
      payment_method: paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: (subtotal || total || 0) / 100,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const createResp = await shiprocketFetch("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const shipmentId = createResp.shipment_id;
    const shiprocketOrderId = createResp.order_id;

    if (!shipmentId) {
      const err = new Error("Shiprocket did not return a shipment_id");
      err.details = createResp;
      throw err;
    }

    // Auto-assign the recommended courier for this shipment.
    const awbResp = await shiprocketFetch("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    const awbData = awbResp?.response?.data;

    return res.status(200).json({
      success: true,
      shiprocketOrderId,
      shipmentId,
      awbCode: awbData?.awb_code || null,
      courier: awbData?.courier_name || null,
      estimatedDelivery: awbData?.expected_delivery_date || null,
      trackingUrl: awbData?.awb_code
        ? `https://shiprocket.co/tracking/${awbData.awb_code}`
        : null,
      shipmentStatus: "Shipment Created",
    });
  } catch (err) {
    console.error("create-order error:", err.message, err.details || "");
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create Shiprocket order",
      details: err.details || null,
    });
  }
};