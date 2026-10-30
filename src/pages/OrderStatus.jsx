// src/pages/OrderStatus.jsx
// Renders on OrderConfirmation.jsx (passed orderId as a prop), AND on the
// standalone "/orders/:orderId" route (reads orderId from the URL via
// useParams). Shows courier/status/AWB from the Firestore order doc, and
// on "Track Order" click, fetches the live Shiprocket tracking timeline.
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import SEO from "../components/SEO";
import "../styles/orderStatus.css";
import "../styles/checkout.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

const TIMELINE_STEPS = [
  "Order Confirmed",
  "Shipment Created",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

function matchStepIndex(statusText) {
  if (!statusText) return 0;
  const s = statusText.toLowerCase();
  if (s.includes("delivered")) return 5;
  if (s.includes("out for delivery")) return 4;
  if (s.includes("transit")) return 3;
  if (s.includes("picked") || s.includes("pickup")) return 2;
  if (s.includes("shipment") || s.includes("awb") || s.includes("manifest")) return 1;
  return 0;
}

export default function OrderStatus({ orderId: orderIdProp }) {
  // Works two ways:
  //  1. Embedded in OrderConfirmation.jsx: <OrderStatus orderId={created.id} />
  //  2. Standalone route "/orders/:orderId": <OrderStatus /> with no prop —
  //     falls back to reading the URL param here.
  const params = useParams();
  const orderId = orderIdProp || params.orderId;

  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Live-listens to the order doc so if you update shipmentStatus later
  // (manually, or via a future webhook handler) this updates without a
  // page refresh.
  useEffect(() => {
    if (!orderId) return;
    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOrder(snap.data());
        } else {
          setNotFound(true);
        }
      },
      (err) => console.warn("OrderStatus listener error:", err)
    );
    return () => unsub();
  }, [orderId]);

  async function handleTrackOrder() {
    if (!order?.awbCode) return;
    setShowTimeline((v) => !v);
    if (tracking || trackingLoading) return; // already fetched / fetching

    setTrackingLoading(true);
    setTrackingError("");
    try {
      const resp = await fetch(
        `${API_BASE}/api/shiprocket/track-order?awb=${encodeURIComponent(order.awbCode)}`
      );
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Tracking failed");
      setTracking(data);
    } catch (err) {
      setTrackingError(err.message || "Could not load tracking info right now");
    } finally {
      setTrackingLoading(false);
    }
  }

  // No orderId at all (neither prop nor URL param) — nothing to show.
  if (!orderId) return null;

  if (notFound) {
    return (
      <div className="order-status-card">
        <span className="dr-icon">❌</span> No order found with ID{" "}
        <span className="mono">{orderId}</span>. Please check the link and try again.
      </div>
    );
  }

  // Order doc is still loading (onSnapshot hasn't resolved yet).
  if (!order) {
    return (
      <div className="order-status-card">
        <div className="muted">Loading order status…</div>
      </div>
    );
  }

  const status = order.shipmentStatus || "Pending";

  // Shiprocket order creation either hasn't fired yet or failed silently —
  // still show something reassuring instead of nothing.
  if (status === "Pending" && !order.awbCode) {
    return (
      <div className="order-status-card pending">
        <span className="dr-icon">⏳</span> Shipment is being set up — this usually takes just a few minutes.
      </div>
    );
  }

  const currentStepIndex = matchStepIndex(tracking?.currentStatus || status);

  return (
    <div className="order-status-card">
      {!orderIdProp && (
        <SEO
          title={`Order #${orderId} Tracking & Status | Perfume Copy`}
          description={`Realtime shipment tracking and delivery status for order #${orderId} at Perfume Copy.`}
          url={`http://www.perfumecopy.com/orders/${orderId}`}
        />
      )}
      <div className="os-grid">
        <div>
          <div className="os-label">Status</div>
          <div className="os-value">{status}</div>
        </div>
        {order.courier && (
          <div>
            <div className="os-label">Courier</div>
            <div className="os-value">{order.courier}</div>
          </div>
        )}
        {order.estimatedDelivery && (
          <div>
            <div className="os-label">Estimated Delivery</div>
            <div className="os-value">{order.estimatedDelivery}</div>
          </div>
        )}
        {order.awbCode && (
          <div>
            <div className="os-label">Tracking Number</div>
            <div className="os-value mono">{order.awbCode}</div>
          </div>
        )}
      </div>

      {order.awbCode && (
        <button type="button" className="btn ghost track-btn" onClick={handleTrackOrder}>
          {showTimeline ? "Hide Tracking" : "Track Order"}
        </button>
      )}

      {showTimeline && (
        <div className="tracking-panel">
          {trackingLoading && <div className="muted">Loading tracking info…</div>}
          {trackingError && <div className="error">{trackingError}</div>}

          {tracking && tracking.found === false && (
            <div className="muted">{tracking.message}</div>
          )}

          {tracking && tracking.found !== false && (
            <>
              <div className="timeline">
                {TIMELINE_STEPS.map((step, i) => (
                  <div
                    key={step}
                    className={`timeline-step ${i <= currentStepIndex ? "done" : ""}`}
                  >
                    <div className="timeline-dot" />
                    <div className="timeline-label">{step}</div>
                  </div>
                ))}
              </div>

              <div className="os-grid" style={{ marginTop: 12 }}>
                <div>
                  <div className="os-label">Current Status</div>
                  <div className="os-value">{tracking.currentStatus}</div>
                </div>
                {tracking.lastUpdate && (
                  <div>
                    <div className="os-label">Last Update</div>
                    <div className="os-value">{tracking.lastUpdate}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
