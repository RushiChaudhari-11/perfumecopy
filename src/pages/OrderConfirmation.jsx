// src/pages/OrderConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../services/productsService";
import "../styles/checkout.css";
import OrderStatus from "./OrderStatus"; // <-- NEW: live Shiprocket delivery tracker
import SEO from "../components/SEO";

// Firestore
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const LAST_ORDER_ID_KEY = "lastOrderId";

export default function OrderConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function fetchOrderFromFirestore(orderId) {
      try {
        const ref = doc(db, "orders", orderId);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setFetchError("Order not found in database.");
        }
      } catch (err) {
        console.error("Failed to fetch order from Firestore:", err);
        setFetchError("Failed to load order from server.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    try {
      const lastOrderId = localStorage.getItem(LAST_ORDER_ID_KEY);
      const lastOrderSnapshot = localStorage.getItem("lastOrder");

      if (lastOrderId) {
        // try Firestore first
        fetchOrderFromFirestore(lastOrderId);
      } else if (lastOrderSnapshot) {
        // fallback to local snapshot
        try {
          const parsed = JSON.parse(lastOrderSnapshot);
          setOrder(parsed);
        } catch (err) {
          console.warn("Failed to parse lastOrder snapshot:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn("OrderConfirmation init error:", err);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="checkout container">
        <SEO
          title="Loading Order | Perfume Copy"
          description="Retrieving your order details."
          url="http://www.perfumecopy.com/order-confirmation"
        />
        <button
          type="button"
          className="back-inline"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
        <div className="empty">
          <h1>Loading your order…</h1>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="checkout container">
        <SEO
          title="Order Status | Perfume Copy"
          description="Check your recent order status at Perfume Copy."
          url="http://www.perfumecopy.com/order-confirmation"
        />
        <button
          type="button"
          className="back-inline"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
        <div className="empty">
          <h1>No recent order found</h1>
          <p className="muted">If you just placed an order, it should appear here. Otherwise, go to shop.</p>
          {fetchError && <div className="error" style={{ marginTop: 8 }}>{fetchError}</div>}
          <div style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={() => navigate("/collections/perfumes")}>Shop perfumes</button>
          </div>
        </div>
      </main>
    );
  }

  // some orders from Firestore may have serverTimestamp() object; try to normalize createdAt
  const createdAt = order.createdAt && typeof order.createdAt.toDate === "function"
    ? order.createdAt.toDate().toISOString()
    : order.createdAt || order.meta?.createdAt || null;

  // Only show live tracking once we actually have a Firestore-backed order
  // with a real id (the localStorage "lastOrder" snapshot fallback also
  // has an id, so this covers both paths).
  const hasTrackableOrder = Boolean(order.id);

  return (
    <main className="checkout container">
      <SEO
        title="Order Confirmation | Perfume Copy"
        description="Thank you for your order with Perfume Copy. Your luxury extrait de parfums are being prepared."
        url="http://www.perfumecopy.com/order-confirmation"
      />
      <button
  type="button"
  className="cp-back back-inline"
  onClick={() => navigate(-1)}
  aria-label="Go back"
>
  <span>←</span>
  <span>Back</span>
</button>

      <div className="conf-card card">
        <h1>Thank you — your order is placed</h1>
        <p className="muted">Order ID: <strong>{order.id}</strong></p>
        {createdAt && <p className="muted">Placed: {new Date(createdAt).toLocaleString()}</p>}

        {/*
          Live delivery status. Right after checkout this will usually just
          show "Order Placed" (the very first step) since the Shiprocket
          shipment call is still in flight or was just fired — that's
          expected. It'll fill in over the following minutes/hours as
          Shiprocket webhooks land, thanks to the Firestore onSnapshot
          listener inside OrderStatus itself.
        */}
        {hasTrackableOrder && (
          <section style={{ marginTop: 16, marginBottom: 4 }}>
            <OrderStatus orderId={order.id} />
          </section>
        )}

        <section className="card">
          <h3>Order details</h3>
          <div className="summary-line">
            <div>Items</div>
            <div>{order.totalItems}</div>
          </div>
          <div className="summary-line">
            <div>Subtotal</div>
            <div>{formatPrice(order.subtotal)}</div>
          </div>
          <div className="summary-line">
            <div>Shipping</div>
            <div>{formatPrice(order.shipping || 0)}</div>
          </div>
          <div className="summary-line total">
            <div>Total</div>
            <div className="big">{formatPrice(order.total)}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Items</h4>
            <div>
              {(order.items || []).map((it, ix) => (
                <div key={ix} className="conf-item-row">
                  <div className="conf-item-left">
                    <img src={it.imageUrl || "/smoke-fallback.jpg"} alt={it.name} />
                    <div style={{ minWidth: 0 }}>
                      <div className="conf-item-name">{it.name}</div>
                      <div className="muted small">{it.volume || ""} × {it.qty}</div>
                    </div>
                  </div>
                  <div className="conf-item-price">{formatPrice((it.price || 0) * (it.qty || 1))}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Shipping to</h3>
          <div className="address-block">
            <div className="address-name">{order.customer.fullName}</div>
            <div className="address-line">
              {order.customer.address1}
              {order.customer.address2 ? `, ${order.customer.address2}` : ""}
            </div>
            <div className="address-line">{order.customer.city} {order.customer.postal}</div>
            <div className="address-line">{order.customer.state} • {order.customer.country}</div>
            <div className="address-line">Phone: {order.customer.phone}</div>
            <div className="address-line">Email: {order.customer.email}</div>
          </div>
        </section>

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button className="btn primary" onClick={() => navigate("/collections/perfumes")}>Continue shopping</button>
          <button className="btn ghost" onClick={() => navigate("/orders")}>View orders</button>
        </div>
      </div>
    </main>
  );
}
