// src/components/ShopByOccasion.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import {
  getProductsRealtime,
  normalizeFirebaseProduct,
  formatPrice,
} from "../services/productsService";
import "./ShopByOccasion.css";

// ─── 5 Occasions with custom Luxury SVGs ────────────────────────────────────
const OCCASIONS = [
  {
    id: "wedding",
    label: "Wedding &\nAnniversary",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="14" r="5" />
        <circle cx="15" cy="11" r="5" />
        <path d="M11 6l1.5-2 1.5 2" />
      </svg>
    ),
  },
  {
    id: "date-night",
    label: "Date Night\n& Party",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3v5a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V3" />
        <path d="M9 12v6" />
        <path d="M6 18h6" />
        <path d="M15 5v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V5" />
        <path d="M18 12v6" />
        <path d="M16 18h4" />
      </svg>
    ),
  },
  {
    id: "office",
    label: "Office\nPerfume",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: "couple",
    label: "Couple",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "daily",
    label: "Daily Use",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
];

export default function ShopByOccasion({ onAddToCart }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("date-night");
  const [addedId, setAddedId] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart, addItem, updateQty, getItemQty } = useCart() || {};
  const { toggleWishlist, isWishlisted } = useWishlist() || {};
  const sectionRef = useRef(null);

  // Subscribe to real-time Firebase products
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const unsubscribe = getProductsRealtime((rawList) => {
      if (!isMounted) return;
      try {
        const normalized = (rawList || []).map((p) =>
          normalizeFirebaseProduct(p, p.id)
        );
        setProducts(normalized);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error processing Firebase products in ShopByOccasion:", err);
        setError("Unable to load occasion collection.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter products by occasion using tags, notes, and categories from real Firebase data
  const currentProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const matches = products.filter((p) => {
      const notesStr = Array.isArray(p.notes)
        ? p.notes.join(" ")
        : typeof p.notes === "string"
          ? p.notes
          : "";
      const tagsStr = Array.isArray(p.tags)
        ? p.tags.join(" ")
        : typeof p.tags === "string"
          ? p.tags
          : "";
      const text = `${p.name || ""} ${p.category || ""} ${p.brand || ""} ${notesStr} ${tagsStr} ${p.description || ""}`.toLowerCase();

      switch (activeTab) {
        case "wedding":
          return (
            text.includes("wedding") ||
            text.includes("anniversary") ||
            text.includes("sandalwood") ||
            text.includes("rose") ||
            text.includes("traditional") ||
            text.includes("rich") ||
            text.includes("oud") ||
            text.includes("amber") ||
            text.includes("oriental") ||
            p.featured
          );
        case "date-night":
          return (
            text.includes("date") ||
            text.includes("night") ||
            text.includes("party") ||
            text.includes("bold") ||
            text.includes("mysterious") ||
            text.includes("sweet") ||
            text.includes("spicy") ||
            text.includes("gourmand") ||
            text.includes("leather") ||
            text.includes("vanilla") ||
            text.includes("noir")
          );
        case "office":
          return (
            text.includes("office") ||
            text.includes("fresh") ||
            text.includes("clean") ||
            text.includes("citrus") ||
            text.includes("marine") ||
            text.includes("cedar") ||
            text.includes("white") ||
            text.includes("daytime") ||
            text.includes("crisp") ||
            text.includes("bergamot")
          );
        case "couple":
          return (
            text.includes("unisex") ||
            text.includes("couple") ||
            text.includes("versatile") ||
            text.includes("pair") ||
            text.includes("trio") ||
            p.category?.toLowerCase() === "unisex"
          );
        case "daily":
          return (
            text.includes("daily") ||
            text.includes("fresh") ||
            text.includes("aquatic") ||
            text.includes("spray") ||
            text.includes("light") ||
            text.includes("deodorant") ||
            text.includes("casual")
          );
        default:
          return true;
      }
    });

    // Ensure 4 unique products per tab by filling from general collection if needed
    const seen = new Set();
    const result = [];

    for (const p of matches) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
      if (result.length >= 4) break;
    }

    if (result.length < 4) {
      for (const p of products) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          result.push(p);
        }
        if (result.length >= 4) break;
      }
    }

    return result.slice(0, 4);
  }, [products, activeTab]);

  const handleAdd = (product, e) => {
    e.stopPropagation();
    if (product.inStock === false) return;

    const currentVolume = selectedVariants[product.id] || product.sizes?.[0] || "50ml";
    const activeVar = (product.variants || []).find((v) => v.volume === currentVolume) || product.variants?.[0] || { price: product.price, volume: "50ml" };
    const img = product.imageUrl || product.image;

    if (addToCart) {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: activeVar.price,
          imageUrl: img,
          volume: currentVolume,
          uniqueId: `${product.id}-${currentVolume}`,
        },
        1
      );
    } else if (addItem) {
      addItem({
        id: product.id,
        name: product.name,
        price: activeVar.price,
        imageUrl: img,
        volume: currentVolume,
        uniqueId: `${product.id}-${currentVolume}`,
        qty: 1,
      });
    } else if (onAddToCart) {
      onAddToCart({ ...product, price: activeVar.price, volume: currentVolume });
    }

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleWishlistClick = (p, e) => {
    e.stopPropagation();
    if (toggleWishlist) {
      toggleWishlist({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl || p.image,
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="shop-occasion-section"
      aria-label="Shop by Occasion"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255, 248, 239, 0.88) 0%, rgba(255, 248, 239, 0.65) 45%, rgba(255, 248, 239, 0.90) 100%), url("${process.env.PUBLIC_URL || ""}/Luxurious%20Marble%20and%20Gold%20Floral%20Stage.png")`,
      }}
    >
      {/* ─── Floating Top Editorial Accents ─── */}
      <div className="occasion-moment-tag" aria-hidden="true">
        <span>FRAGRANCES</span>
        <span>FOR EVERY</span>
        <span>MOMENT</span>
      </div>

      <div className="occasion-script-tag" aria-hidden="true">
        <span>Scents</span>
        <span>for your</span>
        <span>Story</span>
      </div>

      <div className="shop-occasion-container">
        {/* ─── Center Header Area ─── */}
        <div className="shop-occasion-header">
          {/* Gold Floral / Lotus Emblem */}
          <div className="shop-occasion-lotus" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C89B52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c-1.5 3-4 6-4 9a4 4 0 0 0 8 0c0-3-2.5-6-4-9z" />
              <path d="M8 12c-2.5-1-5 0-6 2 2 3 5 2 6-2z" />
              <path d="M16 12c2.5-1 5 0 6 2-2 3-5 2-6-2z" />
              <path d="M9 16c-2 2-2 4-1 5 3 0 5-3 5-5" />
              <path d="M15 16c2 2 2 4 1 5-3 0-5-3-5-5" />
            </svg>
          </div>

          <div className="shop-occasion-eyebrow">
            SIGNATURE COLLECTION
          </div>

          <h2 className="shop-occasion-title">
            Shop by <span className="shop-occasion-title-gold">Occasion</span>
          </h2>

          <p className="shop-occasion-sub">
            Handpicked signature notes tailored for your most memorable moments, daily ventures, and celebrations.
          </p>
        </div>

        {/* ─── 5 Occasion Navigation Pills (Horizontal Row) ─── */}
        <div className="shop-occasion-pills-bar" role="tablist" aria-label="Occasions">
          {OCCASIONS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`shop-occasion-pill ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="pill-icon">{tab.icon}</span>
                <span className="pill-label">{tab.label}</span>
                <span className="pill-arrow">→</span>
              </button>
            );
          })}
        </div>

        {/* ─── Loading Skeleton ─── */}
        {loading && (
          <div className="shop-occasion-grid" aria-busy="true" aria-label="Loading occasion scents">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="occasion-card" style={{ opacity: 0.75, pointerEvents: "none" }}>
                <div className="occasion-media" style={{ background: "linear-gradient(110deg, #F5EDE0 8%, #EAE0D0 18%, #F5EDE0 33%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.6s infinite linear", minHeight: "260px" }} />
                <div className="occasion-info" style={{ padding: "18px" }}>
                  <div style={{ height: "12px", width: "40%", background: "#EAE0D0", borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ height: "18px", width: "80%", background: "#EAE0D0", borderRadius: "4px", marginBottom: "8px" }} />
                  <div style={{ height: "14px", width: "60%", background: "#EAE0D0", borderRadius: "4px", marginBottom: "12px" }} />
                  <div style={{ height: "36px", width: "100%", background: "#EAE0D0", borderRadius: "20px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Error State ─── */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#790D2D" }}>
            <p style={{ fontSize: "16px", marginBottom: "16px" }}>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px",
                background: "#790D2D",
                color: "#FFF8EF",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── 4K Product Cards Grid (4 per desktop row) ─── */}
        {!loading && !error && (
          <div className="shop-occasion-grid">
            {currentProducts.map((p) => {
              const wish = isWishlisted ? isWishlisted(p.id) : false;
              const isAdded = addedId === p.id;
              const currentVolume = selectedVariants[p.id] || p.sizes?.[0] || "50ml";
              const activeVar = (p.variants || []).find((v) => v.volume === currentVolume) || p.variants?.[0] || { price: p.price, originalPrice: p.originalPrice, volume: "50ml" };
              const displayPrice = activeVar.price;
              const displayOriginalPrice = activeVar.originalPrice;
              const hasDiscount = displayOriginalPrice && displayOriginalPrice > displayPrice;
              const discountPct = hasDiscount
                ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
                : null;
              const uid = `${p.id}-${currentVolume}`;
              const itemQty = getItemQty ? getItemQty(uid) : 0;

              const displayImage = p.imageUrl || p.image;
              const subtitle =
                p.inspiredBy
                  ? `Inspired by ${p.inspiredBy}`
                  : Array.isArray(p.notes) && p.notes.length > 0
                    ? p.notes.slice(0, 2).join(" · ")
                    : typeof p.notes === "string" && p.notes.trim()
                      ? p.notes
                      : (p.brand || "Artisanal Haute Parfumerie");

              const badgeText = p.featured
                ? "BESTSELLER"
                : (p.isNewArrival ? "NEW" : (p.badge || null));
              const badgeType = p.badgeType || (p.featured ? "bestseller" : "hot");

              return (
                <div
                  key={p.id}
                  className="occasion-card"
                  onClick={() => navigate(`/product/${p.slug || p.id}`, { state: { product: p } })}
                >
                  {/* 4K Image Media Box */}
                  <div className="occasion-media">
                    {badgeText && (
                      <span className={`occasion-badge ${badgeType}`}>
                        {badgeText}
                      </span>
                    )}

                    {/* Circular Wishlist Button */}
                    <button
                      type="button"
                      className={`occasion-wish-btn ${wish ? "active" : ""}`}
                      onClick={(e) => handleWishlistClick(p, e)}
                      aria-label="Wishlist"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={wish ? "#790D2D" : "none"}
                        stroke={wish ? "#790D2D" : "currentColor"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    <img
                      src={displayImage}
                      alt={p.name}
                      className="occasion-img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Product Information */}
                  <div className="occasion-info">
                    <span className="occasion-cat">
                      {(p.category || "EAU DE PARFUM").toUpperCase()}
                    </span>
                    <h3 className="occasion-name" title={p.name}>
                      {p.name}
                    </h3>
                    <div className="occasion-subtitle" title={subtitle}>
                      {subtitle}
                    </div>

                    {/* Rating Stars - Only render if rating exists */}
                    {p.rating ? (
                      <div className="occasion-rating">
                        <div className="occasion-stars">
                          {"★".repeat(Math.round(p.rating))}
                        </div>
                        <span className="occasion-reviews-text">
                          {p.rating} {p.reviewsCount ? `(${p.reviewsCount} Reviews)` : ""}
                        </span>
                      </div>
                    ) : (
                      <div className="occasion-rating">
                        <div className="occasion-stars" style={{ color: "#C89B52" }}>
                          ★★★★★
                        </div>
                        <span className="occasion-reviews-text">Signature Parfum</span>
                      </div>
                    )}

                    {/* Size Variant Selector Pills (50ml / 100ml) */}
                    <div className="occasion-variant-bar" onClick={(e) => e.stopPropagation()}>
                      {(p.variants && p.variants.length > 0 ? p.variants : [{ volume: "50ml" }, { volume: "100ml" }]).map((v) => {
                        const isSelected = currentVolume === v.volume;
                        return (
                          <button
                            key={v.volume}
                            type="button"
                            className={`occasion-variant-pill ${isSelected ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariants((prev) => ({ ...prev, [p.id]: v.volume }));
                            }}
                          >
                            {v.volume}
                          </button>
                        );
                      })}
                    </div>

                    {/* Prices & Discount */}
                    <div className="occasion-price-row">
                      <span className="occasion-price">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="occasion-original-price">
                          {formatPrice(displayOriginalPrice)}
                        </span>
                      )}
                      {discountPct && (
                        <span className="occasion-discount-badge">
                          Save {discountPct}%
                        </span>
                      )}
                    </div>

                    {/* Primary Burgundy Add to Cart Button or Stepper */}
                    {itemQty > 0 ? (
                      <div className="card-qty-stepper" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="card-qty-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (updateQty) updateQty(uid, itemQty - 1);
                          }}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="card-qty-val">{itemQty}</span>
                        <button
                          type="button"
                          className="card-qty-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (updateQty) updateQty(uid, itemQty + 1);
                          }}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`occasion-action-btn ${p.inStock === false ? "disabled" : ""}`}
                        onClick={(e) => handleAdd(p, e)}
                        disabled={p.inStock === false}
                      >
                        <span>{p.inStock !== false ? "Add to Cart" : "SOLD OUT"}</span>
                        {p.inStock !== false && <span className="occasion-btn-arrow-circle">→</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Bottom "VIEW ALL OCCASIONS" CTA ─── */}
        <div className="shop-occasion-footer-cta">
          <button
            type="button"
            className="shop-occasion-view-all"
            onClick={() => navigate("/collections/all")}
          >
            <span>VIEW ALL OCCASIONS</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
