// src/pages/CartPage.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { formatPrice } from "../services/productsService";
import SEO from "../components/SEO";
import "../styles/cart.css";

// Free shipping threshold in Rupees (₹2,000)
const FREE_SHIPPING_THRESHOLD = 2000;

export default function CartPage() {
  const { items, updateQty, removeFromCart, clearCart, subtotal, totalQty } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  const handleQtyChange = useCallback(
    (uniqueId, raw) => {
      const parsed = parseInt(raw, 10);
      const qty = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
      updateQty(uniqueId, qty);
    },
    [updateQty]
  );

  const handleMoveToWishlist = (item) => {
    // Add base product to wishlist
    addToWishlist({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      volume: item.volume,
    });
    // Remove from cart
    removeFromCart(item.uniqueId);
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "SIGNATURE10" || code === "LUXURY" || code === "ATELIER") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid code. Try 'SIGNATURE10'");
    }
  };

  // Calculations
  const discountAmount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const shippingCost = isFreeShipping || subtotal === 0 ? 0 : 150; // ₹150 if below threshold
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  // ─── EMPTY STATE ──────────────────────────────────────────────────────────
  if (!items || items.length === 0) {
    return (
      <main className="luxury-cart-page">
        <SEO
          title="Shopping Bag | Perfume Copy"
          description="Your bespoke fragrance bag is currently empty. Explore our artisanal extrait de parfums and luxury collections."
          url="http://www.perfumecopy.com/cart"
        />
        <div className="luxury-cart-container">
          <button type="button" className="luxury-cart-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="luxury-cart-empty-card">
            <div className="empty-icon-halo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>

            <span className="empty-eyebrow">✦ SIGNATURE OLFACTORY ATELIER ✦</span>
            <h1 className="empty-title">Your Fragrance Bag is Empty</h1>
            <p className="empty-desc">
              Your bespoke scent collection is awaiting its inaugural masterpiece. Explore our artisanal extrait de parfums and rare seasonal reserves.
            </p>

            <div className="empty-action-wrap">
              <button
                type="button"
                className="luxury-cart-primary-btn"
                onClick={() => navigate("/collections")}
              >
                <span>Explore Fragrances</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Atelier Luxury Trust Pillars */}
            <div className="empty-perks-strip">
              <div className="empty-perk-item">
                <span className="perk-gold-star">✦</span>
                <span>Complimentary 2ml Extrait with every order</span>
              </div>
              <div className="empty-perk-item">
                <span className="perk-gold-star">✦</span>
                <span>White-Glove Insured Delivery</span>
              </div>
              <div className="empty-perk-item">
                <span className="perk-gold-star">✦</span>
                <span>100% Authentic Master Accords</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── POPULATED STATE ──────────────────────────────────────────────────────
  return (
    <main className="luxury-cart-page">
      <SEO
        title="Your Shopping Bag | Perfume Copy"
        description="Review your artisanal extrait de parfums and luxury fragrance selections."
        url="http://www.perfumecopy.com/cart"
      />
      <div className="luxury-cart-container">
        {/* Navigation & Header */}
        <div className="luxury-cart-header">
          <button type="button" className="luxury-cart-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Continue Shopping</span>
          </button>

          <div className="cart-header-title-wrap">
            <span className="cart-header-eyebrow">✦ SIGNATURE ATELIER ✦</span>
            <h1 className="cart-header-title">
              Your Shopping Bag
              <span className="cart-item-count-badge">
                {totalQty} {totalQty === 1 ? "bottle" : "bottles"}
              </span>
            </h1>
            <p className="cart-header-subtitle">
              Refined extrait de parfums and artisanal accords, reserved exclusively for you.
            </p>
          </div>

          {/* Complimentary Shipping Progress Banner */}
          <div className="luxury-shipping-bar-card">
            <div className="shipping-bar-text-row">
              {isFreeShipping ? (
                <span className="shipping-achieved">
                  <span className="shipping-star">✦</span> You have unlocked <strong>Complimentary White-Glove Express Shipping</strong>!
                </span>
              ) : (
                <span>
                  Add <strong>{formatPrice(remainingForFreeShipping)}</strong> more to unlock <strong>Complimentary White-Glove Delivery</strong>
                </span>
              )}
              <span className="shipping-progress-percent">{shippingProgress}%</span>
            </div>
            <div className="shipping-progress-track">
              <div
                className="shipping-progress-fill"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Items & Order Summary */}
        <div className="luxury-cart-grid">
          {/* Left Column: Cart Items List */}
          <div className="luxury-cart-items-col">
            <div className="cart-items-header-bar">
              <span>Selected Fragrance</span>
              <span className="desktop-only-label">Subtotal</span>
            </div>

            <div className="luxury-cart-items-list">
              <AnimatePresence>
                {items.map((it) => {
                  const uid = it.uniqueId || `${it.id}-${it.volume || "50ml"}`;
                  const qty = it.qty || 1;
                  const lineTotal = (typeof it.price === "number" ? it.price : 0) * qty;

                  return (
                    <motion.div
                      key={uid}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden", marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      className="luxury-cart-item-card"
                    >
                      <div className="cart-item-media-wrap">
                        <img
                          src={it.imageUrl || "/smoke-fallback.jpg"}
                          alt={it.name}
                          className="cart-item-thumb"
                          loading="lazy"
                        />
                      </div>

                      <div className="cart-item-details">
                        <div className="cart-item-top-row">
                          <div>
                            <span className="cart-item-volume-tag">
                              {it.volume || "100ml Extrait"}
                            </span>
                            <h3 className="cart-item-name">{it.name}</h3>
                          </div>
                          <div className="cart-item-price-col">
                            <span className="cart-item-total-price">{formatPrice(lineTotal)}</span>
                            {qty > 1 && (
                              <span className="cart-item-unit-price">
                                {formatPrice(it.price)} each
                              </span>
                            )}
                          </div>
                        </div>

                        {it.description && (
                          <p className="cart-item-desc">{it.description}</p>
                        )}

                        <div className="cart-item-controls-row">
                          {/* Stepper Quantity Control */}
                          <div className="luxury-qty-stepper">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQty(uid, Math.max(1, qty - 1))}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) => handleQtyChange(uid, e.target.value)}
                              className="qty-input"
                              aria-label="Item quantity"
                            />
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQty(uid, qty + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Actions */}
                          <div className="cart-item-actions">
                            <button
                              type="button"
                              className="item-action-link"
                              onClick={() => handleMoveToWishlist(it)}
                              title="Move to Saved Wishlist"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              <span>Move to Wishlist</span>
                            </button>

                            <button
                              type="button"
                              className="item-action-link remove"
                              onClick={() => removeFromCart(uid)}
                              title="Remove item from bag"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom Actions Row */}
            <div className="cart-bottom-actions">
              <button
                type="button"
                className="cart-ghost-btn"
                onClick={() => navigate("/collections")}
              >
                ← Continue Browsing
              </button>

              <button
                type="button"
                className="cart-clear-link"
                onClick={clearCart}
              >
                Clear Shopping Bag
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Luxury Order Summary */}
          <aside className="luxury-cart-summary-col">
            <div className="luxury-summary-card">
              <div className="summary-card-header">
                <span className="summary-eyebrow">ORDER BREAKDOWN</span>
                <h2 className="summary-title">Summary</h2>
              </div>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span className="row-label">Bag Subtotal</span>
                  <span className="row-val">{formatPrice(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span className="row-label">
                    White-Glove Delivery
                    <span className="sub-tag">Insured dispatch</span>
                  </span>
                  <span className="row-val">
                    {shippingCost === 0 ? (
                      <span className="free-badge">COMPLIMENTARY</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                <div className="summary-row">
                  <span className="row-label">
                    Atelier Gift Packaging
                    <span className="sub-tag">Ribboned luxury keepsake box</span>
                  </span>
                  <span className="row-val free-badge">COMPLIMENTARY</span>
                </div>

                {promoApplied && (
                  <div className="summary-row promo-discount-row">
                    <span className="row-label">
                      Atelier Privilege (10%)
                      <button
                        type="button"
                        className="promo-remove-btn"
                        onClick={() => {
                          setPromoApplied(false);
                          setPromoCode("");
                        }}
                      >
                        ✕ Remove
                      </button>
                    </span>
                    <span className="row-val discount-val">
                      −{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="summary-gold-divider" />

                <div className="summary-row total-row">
                  <div>
                    <span className="total-label">Estimated Total</span>
                    <span className="total-sub">Includes all luxury duties & taxes</span>
                  </div>
                  <div className="total-price-val">{formatPrice(grandTotal)}</div>
                </div>
              </div>

              {/* Promo Code Accordion / Input */}
              <form onSubmit={handleApplyPromo} className="summary-promo-form">
                <div className="promo-input-wrap">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError("");
                    }}
                    placeholder="Enter Atelier Voucher code"
                    className="promo-input"
                    disabled={promoApplied}
                  />
                  <button
                    type="submit"
                    className="promo-apply-btn"
                    disabled={promoApplied || !promoCode.trim()}
                  >
                    {promoApplied ? "Applied" : "Apply"}
                  </button>
                </div>
                {promoError && <p className="promo-error-msg">{promoError}</p>}
                {promoApplied && (
                  <p className="promo-success-msg">✦ 10% Signature Connoisseur Privilege Applied</p>
                )}
              </form>

              {/* Primary Burgundy Checkout CTA Button */}
              <button
                type="button"
                className="luxury-checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Proceed to Checkout</span>
              </button>

              {/* Atelier Security Guarantee Badges */}
              <div className="summary-guarantee-badges">
                <div className="guarantee-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>256-Bit SSL Encrypted Checkout</span>
                </div>
                <div className="guarantee-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>100% Authentic Maison Perfumery</span>
                </div>
                <div className="guarantee-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Complimentary Returns & Exchanges</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
