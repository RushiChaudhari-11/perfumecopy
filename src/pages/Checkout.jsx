// src/pages/Checkout.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../services/productsService";
import SEO from "../components/SEO";
import "../styles/checkout.css";
import { motion, AnimatePresence } from "framer-motion";

// Firestore
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const DRAFT_KEY = "checkoutFormDraft";
const LAST_ORDER_ID_KEY = "lastOrderId";

// Base URL for the Shiprocket backend functions. Leave blank if these
// Vercel functions are deployed on the SAME domain as this React app
// (most common setup — relative /api/... calls just work). Only set
// REACT_APP_API_BASE_URL if the functions live on a different domain.
const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

// Reusable header row: Back button (left) + eyebrow + Playfair title.
function PageHeader({ navigate, title, eyebrow }) {
  return (
    <>
      <button
        type="button"
        className="cp-back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <div className="page-header-row">
        {eyebrow && <div className="checkout-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, totalQty, clearCart } = useCart();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal: "",
    country: "India",
    shippingMethod: "standard",
    billingSame: true,
    cardName: "",
    cardNumber: "",
    cardExp: "",
    cardCvv: "",
    paymentMethod: "cod", // cod | card
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Shiprocket delivery-check state (Phase 1)
  const [deliveryCheck, setDeliveryCheck] = useState({
    status: "idle", // idle | loading | success | unavailable | error
    estimatedDays: null,
    courier: null,
    codAvailable: null,
    errorMsg: "",
  });

  // responsive breakpoint detection for mobile summary
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 900 : true
  );
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 900);
  }, []);
  useEffect(() => {
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // load draft on mount (if exists)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((f) => ({ ...f, ...parsed }));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // autosave: debounce writes to localStorage
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const toSave = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          postal: form.postal,
          country: form.country,
          shippingMethod: form.shippingMethod,
          paymentMethod: form.paymentMethod,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
      } catch (err) {
        console.warn("Could not save draft", err);
      }
    }, 600); // 600ms debounce

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    form.fullName,
    form.email,
    form.phone,
    form.address1,
    form.address2,
    form.city,
    form.state,
    form.postal,
    form.country,
    form.shippingMethod,
    form.paymentMethod,
  ]);

  if (!items || items.length === 0) {
    return (
      <main className="checkout container">
        <SEO
          title="Checkout | Perfume Copy"
          description="Your bespoke fragrance bag is currently empty. Explore our artisanal extrait de parfums."
          url="http://www.perfumecopy.com/checkout"
        />
        <PageHeader navigate={navigate} title="Checkout" eyebrow="Secure Atelier Checkout" />
        <div className="empty">
          <div style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(200, 155, 82, 0.12)",
            border: "1.5px solid rgba(200, 155, 82, 0.28)",
            color: "#C89B52",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2>Your bag's feeling a little light.</h2>
          <p className="muted">Add a rare artisanal extrait (or three) before completing your order.</p>
          <div style={{ marginTop: 18 }}>
            <button
              className="btn primary"
              type="button"
              onClick={() => navigate("/collections/perfumes")}
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              <span>Explore Fragrances</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    );
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
    // pincode changed -> any previous delivery check result is stale
    if (key === "postal" && deliveryCheck.status !== "idle") {
      setDeliveryCheck({
        status: "idle",
        estimatedDays: null,
        courier: null,
        codAvailable: null,
        errorMsg: "",
      });
    }
  }

  // ---------------- Phase 1: Shiprocket delivery availability check ----------------
  async function checkDelivery() {
    const pincode = form.postal.trim();

    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryCheck({
        status: "error",
        estimatedDays: null,
        courier: null,
        codAvailable: null,
        errorMsg: "Enter a valid 6-digit pincode first",
      });
      return;
    }

    setDeliveryCheck((d) => ({ ...d, status: "loading", errorMsg: "" }));

    try {
      const resp = await fetch(`${API_BASE}/api/shiprocket/check-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, cod: form.paymentMethod === "cod" }),
      });
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Could not check delivery");

      if (data.available) {
        setDeliveryCheck({
          status: "success",
          estimatedDays: data.estimatedDays,
          courier: data.courier,
          codAvailable: data.codAvailable,
          errorMsg: "",
        });
      } else {
        setDeliveryCheck({
          status: "unavailable",
          estimatedDays: null,
          courier: null,
          codAvailable: null,
          errorMsg: "",
        });
      }
    } catch (err) {
      setDeliveryCheck({
        status: "error",
        estimatedDays: null,
        courier: null,
        codAvailable: null,
        errorMsg: err.message || "Something went wrong. Please try again.",
      });
    }
  }

  function validate() {
    const err = {};
    if (!form.fullName.trim()) err.fullName = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) err.email = "Valid email required";
    if (!form.phone.trim() || form.phone.trim().length < 7) err.phone = "Valid phone number required";
    if (!form.address1.trim()) err.address1 = "Address is required";
    if (!form.city.trim()) err.city = "City is required";
    if (!form.state.trim()) err.state = "State / Region is required";
    if (!form.postal.trim()) err.postal = "Postal code is required";

    if (form.paymentMethod === "card") {
      if (!form.cardName.trim()) err.cardName = "Name on card required";
      if (!/^\d{12,19}$/.test(form.cardNumber.replace(/\s+/g, ""))) err.cardNumber = "Card number looks invalid";
      if (!/^\d{2}\/\d{2}$/.test(form.cardExp)) err.cardExp = "Expiry must be MM/YY";
      if (!/^\d{3,4}$/.test(form.cardCvv)) err.cardCvv = "CVV is required";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  async function placeOrder(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage("");
    if (!validate()) {
      // if mobile, scroll to first error field lightly
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        const el = document.querySelector(`[name="${firstKey}"], input[aria-label="${firstKey}"]`);
        if (el && typeof el.focus === "function") el.focus();
      }
      return;
    }
    setProcessing(true);

    // Build order payload
    const shippingCost = form.shippingMethod === "express" ? 19900 : 0;
    const total = subtotal + shippingCost;

    const orderPayload = {
      subtotal,
      shipping: shippingCost,
      tax: 0,
      total,
      totalItems: totalQty,
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price || 0,
        qty: it.qty || 1,
        volume: it.volume || null,
        imageUrl: it.imageUrl || null,
        uniqueId: it.uniqueId || null,
      })),
      customer: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        postal: form.postal,
        country: form.country,
      },
      payment: {
        method: form.paymentMethod,
        status: form.paymentMethod === "cod" ? "pending" : "authorized",
      },
      meta: {
        createdAt: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    };

    let createdOrderId = null;

    try {
      const uid = auth?.currentUser?.uid || null;
      const ordersCol = collection(db, "orders");

      const created = await addDoc(ordersCol, {
        ...orderPayload,
        userId: uid,
        createdAt: serverTimestamp(),
      });

      createdOrderId = created.id;

      if (uid) {
        try {
          const userOrderRef = doc(db, "users", uid, "orders", created.id);
          await setDoc(userOrderRef, {
            orderId: created.id,
            createdAt: serverTimestamp(),
            subtotal: orderPayload.subtotal,
            total: orderPayload.total,
            totalItems: orderPayload.totalItems,
            status: orderPayload.payment.status,
          });
        } catch (userOrdersErr) {
          console.warn("Failed to write user order history:", userOrdersErr);
        }
      }

      // ---------------- Phase 2: Shiprocket order + shipment creation ----------------
      // This NEVER blocks the checkout — if Shiprocket fails for any
      // reason, the Firestore order stays saved with shipmentStatus
      // "Pending" and the customer still reaches Order Confirmation.
      try {
        const shipResp = await fetch(`${API_BASE}/api/shiprocket/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: created.id,
            customer: orderPayload.customer,
            items: orderPayload.items,
            total: orderPayload.total,
            subtotal: orderPayload.subtotal,
            paymentMethod: orderPayload.payment.method,
          }),
        });
        const shipData = await shipResp.json();

        if (shipResp.ok && shipData.success) {
          await setDoc(
            doc(db, "orders", created.id),
            {
              shiprocketOrderId: shipData.shiprocketOrderId || null,
              shipmentId: shipData.shipmentId || null,
              awbCode: shipData.awbCode || null,
              courier: shipData.courier || null,
              estimatedDelivery: shipData.estimatedDelivery || null,
              trackingUrl: shipData.trackingUrl || null,
              shipmentStatus: shipData.shipmentStatus || "Shipment Created",
            },
            { merge: true }
          );
        } else {
          throw new Error(shipData.error || "Shiprocket order creation failed");
        }
      } catch (shipErr) {
        console.warn("Shiprocket integration failed, order still saved:", shipErr);
        try {
          await setDoc(
            doc(db, "orders", created.id),
            { shipmentStatus: "Pending" },
            { merge: true }
          );
        } catch (e) {
          // secondary failure — order is still safely saved with base data
        }
      }

      try {
        localStorage.setItem(LAST_ORDER_ID_KEY, created.id);
        localStorage.setItem("lastOrder", JSON.stringify({ id: created.id, ...orderPayload }));
      } catch (err) {
        // ignore localstorage errors
      }

      localStorage.removeItem(DRAFT_KEY);
      clearCart();

      navigate("/order-confirmation");
    } catch (err) {
      console.error("Order placement failed (Firestore):", err);
      if (createdOrderId) {
        // order was saved but something after it broke — still send them
        // to confirmation rather than making them re-order.
        navigate("/order-confirmation");
        return;
      }
      setErrorMessage("Something went wrong while saving your order. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  // computed totals
  const shippingCost = form.shippingMethod === "express" ? 19900 : 0;
  const totalPrice = subtotal + shippingCost;

  const steps = [
    { id: 1, label: "Contact" },
    { id: 2, label: "Shipping" },
    { id: 3, label: "Payment" },
  ];
  const activeStep = form.paymentMethod === "card" ? 3 : form.address1 ? 2 : 1;

  // programmatic submit for mobile CTA button
  function handleMobilePlaceClick() {
    if (formRef.current && typeof formRef.current.requestSubmit === "function") {
      formRef.current.requestSubmit();
    } else if (formRef.current) {
      // fallback: call handler directly
      placeOrder();
    }
  }

  return (
    <main className="checkout container">
      <SEO
        title="Secure Checkout | Perfume Copy"
        description="Complete your order securely for luxury artisanal fragrances and extrait de parfums at Perfume Copy."
        url="http://www.perfumecopy.com/checkout"
      />
      <PageHeader navigate={navigate} title="Complete your order" eyebrow="Secure Checkout" />

      <div className="checkout-progress" role="navigation" aria-label="Checkout progress">
        {steps.map((s) => {
          const isComplete = s.id < activeStep;
          const isActive = s.id === activeStep;
          return (
            <div
              key={s.id}
              className={`step ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}`}
            >
              <div className="step-dot" aria-hidden>{isComplete ? "✓" : s.id}</div>
              <div className="step-label">{s.label}</div>
            </div>
          );
        })}
      </div>
      <p className="lead">You're this close — a few details and it's on its way.</p>

      <div className="checkout-grid">
        <form
          className="checkout-form card"
          onSubmit={placeOrder}
          noValidate
          ref={formRef}
        >
          <section>
            <div className="form-eyebrow"><span className="num">01</span> Contact</div>
            <h2>Who's it going to?</h2>
            <p className="muted">We'll only reach out if something needs your attention.</p>

            <label>
              <div className="label">Full name <span className="req-star">*</span></div>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Your full name"
                inputMode="text"
              />
              {errors.fullName && <div className="error">{errors.fullName}</div>}
            </label>

            <label>
              <div className="label">Email</div>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                inputMode="email"
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </label>

            <label>
              <div className="label">Phone <span className="req-star">*</span></div>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 98765 43210"
                inputMode="tel"
              />
              {errors.phone && <div className="error">{errors.phone}</div>}
            </label>
          </section>

          <section>
            <div className="form-eyebrow"><span className="num">02</span> Delivery address</div>
            <h2>Where should it arrive?</h2>

            <label>
              <div className="label">Address line 1 <span className="req-star">*</span></div>
              <input
                name="address1"
                type="text"
                value={form.address1}
                onChange={(e) => updateField("address1", e.target.value)}
                placeholder="Street, building, suite"
                inputMode="text"
              />
              {errors.address1 && <div className="error">{errors.address1}</div>}
            </label>

            <label>
              <div className="label">Address line 2 <span className="muted">(optional)</span></div>
              <input
                name="address2"
                type="text"
                value={form.address2}
                onChange={(e) => updateField("address2", e.target.value)}
                placeholder="Apartment, floor, landmark"
              />
            </label>

            <div className="two-col" style={{ marginTop: 4 }}>
              <label>
                <div className="label">City <span className="req-star">*</span></div>
                <input name="city" type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                {errors.city && <div className="error">{errors.city}</div>}
              </label>

              <label>
                <div className="label">State / Region <span className="req-star">*</span></div>
                <input name="state" type="text" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
                {errors.state && <div className="error">{errors.state}</div>}
              </label>
            </div>

            <div className="two-col" style={{ marginTop: 6 }}>
              <label>
                <div className="label">Postal code <span className="req-star">*</span></div>
                <input name="postal" type="text" value={form.postal} onChange={(e) => updateField("postal", e.target.value)} />
                {errors.postal && <div className="error">{errors.postal}</div>}
              </label>

              <label>
                <div className="label">Country</div>
                <input name="country" type="text" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
              </label>
            </div>

            {/* ---------------- Shiprocket Phase 1: delivery availability ---------------- */}
            <div className="delivery-check-block">
              <button
                type="button"
                className="btn ghost delivery-check-btn"
                onClick={checkDelivery}
                disabled={deliveryCheck.status === "loading"}
              >
                {deliveryCheck.status === "loading" ? "Checking…" : "Check Delivery"}
              </button>

              {deliveryCheck.status === "success" && (
                <div className="delivery-result available">
                  <div className="dr-line"><span className="dr-icon">✅</span>Delivery Available</div>
                  <div className="dr-sub">Estimated Delivery: {deliveryCheck.estimatedDays} Days</div>
                  <div className="dr-sub">Courier Partner: {deliveryCheck.courier}</div>
                  <div className="dr-sub">{deliveryCheck.codAvailable ? "COD Available" : "COD Not Available"}</div>
                </div>
              )}

              {deliveryCheck.status === "unavailable" && (
                <div className="delivery-result unavailable">
                  <span className="dr-icon">❌</span>Delivery is not available for this pincode.
                </div>
              )}

              {deliveryCheck.status === "error" && (
                <div className="delivery-result error-state">{deliveryCheck.errorMsg}</div>
              )}
            </div>
          </section>

          <section>
            <div className="form-eyebrow"><span className="num">03</span> Shipping &amp; payment</div>
            <h2>Pick your pace</h2>
            <p className="muted">Choose how fast, then how you'd like to pay.</p>

            <div className="option-grid">
              <label className={`option-card ${form.shippingMethod === "standard" ? "selected" : ""}`}>
                <input
                  aria-label="Standard shipping"
                  type="radio"
                  name="shipping"
                  checked={form.shippingMethod === "standard"}
                  onChange={() => updateField("shippingMethod", "standard")}
                />
                <span className="option-main">
                  <span className="option-title">Standard</span>
                  <span className="option-sub">3–5 business days</span>
                </span>
                <span className="option-price">Free</span>
              </label>

              <label className={`option-card ${form.shippingMethod === "express" ? "selected" : ""}`}>
                <input
                  aria-label="Express shipping"
                  type="radio"
                  name="shipping"
                  checked={form.shippingMethod === "express"}
                  onChange={() => updateField("shippingMethod", "express")}
                />
                <span className="option-main">
                  <span className="option-title">Express</span>
                  <span className="option-sub">1–2 business days</span>
                </span>
                <span className="option-price">{formatPrice(19900)}</span>
              </label>
            </div>

            <div className="option-grid" style={{ marginTop: 12 }}>
              <label className={`option-card ${form.paymentMethod === "cod" ? "selected" : ""}`}>
                <input
                  aria-label="Cash on Delivery"
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === "cod"}
                  onChange={() => updateField("paymentMethod", "cod")}
                />
                <span className="option-main">
                  <span className="option-title">Cash on Delivery</span>
                  <span className="option-sub">Pay when it arrives</span>
                </span>
              </label>

              <label className={`option-card ${form.paymentMethod === "card" ? "selected" : ""}`}>
                <input
                  aria-label="Card payment"
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === "card"}
                  onChange={() => updateField("paymentMethod", "card")}
                />
                <span className="option-main">
                  <span className="option-title">Card</span>
                  <span className="option-sub">Test mode</span>
                </span>
              </label>
            </div>

            {form.paymentMethod === "card" && (
              <div className="card-fields" style={{ marginTop: 10 }}>
                <label>
                  <div className="label">Name on card</div>
                  <input name="cardName" value={form.cardName} onChange={(e) => updateField("cardName", e.target.value)} placeholder="Name on card" />
                  {errors.cardName && <div className="error">{errors.cardName}</div>}
                </label>

                <label>
                  <div className="label">Card number</div>
                  <input name="cardNumber" placeholder="4242 4242 4242 4242" value={form.cardNumber} onChange={(e) => updateField("cardNumber", e.target.value)} />
                  {errors.cardNumber && <div className="error">{errors.cardNumber}</div>}
                </label>

                <div className="two-col" style={{ marginTop: 6 }}>
                  <label>
                    <div className="label">Expiry (MM/YY)</div>
                    <input name="cardExp" value={form.cardExp} onChange={(e) => updateField("cardExp", e.target.value)} />
                    {errors.cardExp && <div className="error">{errors.cardExp}</div>}
                  </label>

                  <label>
                    <div className="label">CVV</div>
                    <input name="cardCvv" value={form.cardCvv} onChange={(e) => updateField("cardCvv", e.target.value)} />
                    {errors.cardCvv && <div className="error">{errors.cardCvv}</div>}
                  </label>
                </div>
              </div>
            )}
          </section>

          {errorMessage && <div className="error" style={{ marginTop: 8 }}>{errorMessage}</div>}

          <div className="actions-row">
            <button className="btn ghost" type="button" onClick={() => navigate(-1)} disabled={processing}>
              Back
            </button>
            <button className="btn primary" type="submit" disabled={processing}>
              {processing ? "Processing…" : `Place order • ${formatPrice(totalPrice)}`}
            </button>
          </div>
        </form>

        <aside className="order-summary card" aria-label="Order summary">
          <div className="ticket-body">
            <div className="ticket-eyebrow">Order Summary</div>
            <h2>Your selection</h2>
            <div className="chips">
              <span className="chip">Secure payment</span>
              <span className="chip">Free returns</span>
            </div>

            <div className="summary-items" aria-live="polite">
              <AnimatePresence initial={false}>
                {items.map((it) => {
                  const uid = it.uniqueId || `${it.id}-${it.volume || "50ml"}`;
                  const qty = it.qty || 1;
                  const unitPrice = typeof it.price === "number" ? it.price : 0;
                  const lineTotal = unitPrice * qty;

                  return (
                    <motion.div
                      key={uid + "-" + qty}
                      initial={{ opacity: 0, x: 8, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="summary-row"
                    >
                      <div className="s-left">
                        <img src={it.imageUrl || "/smoke-fallback.jpg"} alt={it.name} />
                        <div style={{ minWidth: 0 }}>
                          <div className="s-name">{it.name}</div>
                          <div className="s-meta">{it.volume || "50ml"} × {qty}</div>
                        </div>
                      </div>

                      <div className="s-right">{formatPrice(lineTotal)}</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="summary-line">
              <div>Subtotal</div>
              <div>{formatPrice(subtotal)}</div>
            </div>
            <div className="summary-line">
              <div>Shipping</div>
              <div>{formatPrice(shippingCost)}</div>
            </div>
            <div className="summary-line total">
              <div>Total</div>
              <div className="big">{formatPrice(totalPrice)}</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile fixed bottom summary + CTA */}
      {isMobile && (
        <div className="mobile-summary" aria-hidden={false}>
          <div className="mobile-summary-left">
            <div className="mobile-total-label">Total</div>
            <div className="mobile-total-amount">{formatPrice(totalPrice)}</div>
          </div>
          <div className="mobile-summary-right">
            <button
              className="btn primary"
              onClick={handleMobilePlaceClick}
              disabled={processing}
              aria-label="Place order"
            >
              {processing ? "Processing…" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
