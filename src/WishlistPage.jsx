// src/WishlistPage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "./services/productsService";
import { useCart } from "./contexts/CartContext";
import { useWishlist } from "./contexts/WishlistContext";
import QuickView from "./QuickView";
import SEO from "./components/SEO";
import "./styles/wishlist.css";

const buildVariant = (product, volume) => {
  const fallback = {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl:
      product.images && product.images.length > 0 ? product.images[0] : product.imageUrl || product.image,
    price: product.price || 0,
    volume: volume || "50ml",
    uniqueId: `${product.id}-${volume || "50ml"}`,
  };

  if (!product?.prices || product.prices.length === 0) return fallback;

  const p = product.prices.find((x) => x.volume === volume) || product.prices[0];
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl:
      product.images && product.images.length > 0 ? product.images[0] : product.imageUrl || product.image,
    price: p.price,
    volume: p.volume,
    uniqueId: `${product.id}-${p.volume}`,
  };
};

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Batch action: Add all wishlisted items to cart
  const handleAddAllToCart = () => {
    items.forEach((p) => {
      const defaultVolume =
        p.prices && p.prices.some((x) => x.volume === "50ml")
          ? "50ml"
          : p.prices && p.prices[0]
          ? p.prices[0].volume
          : "50ml";
      const variant = buildVariant(p, defaultVolume);
      addToCart(variant, 1);
    });
  };

  return (
    <main className="luxury-wishlist-page">
      <SEO
        title="Your Curated Wishlist | Perfume Copy"
        description="Review and manage your saved luxury perfumes, rare extrait de parfums, and bespoke accords at Perfume Copy."
        url="http://www.perfumecopy.com/wishlist"
      />
      <div className="luxury-wishlist-container">
        {/* Back Navigation Button */}
        <button
          type="button"
          className="luxury-wishlist-back-btn"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>

        {/* Wishlist Header */}
        <div className="luxury-wishlist-header">
          <div className="wishlist-header-left">
            <span className="wishlist-header-eyebrow">✦ PRIVATE OLFACTORY SANCTUARY ✦</span>
            <h1 className="wishlist-header-title">
              My Curated Wishlist
              <span className="wishlist-count-badge">
                {items.length} {items.length === 1 ? "scent" : "scents"}
              </span>
            </h1>
            <p className="wishlist-header-subtitle">
              Your handpicked selection of artisanal accords and rare extrait de parfums, saved for your next memorable moment.
            </p>
          </div>

          {items.length > 0 && (
            <div className="wishlist-header-actions">
              <button
                type="button"
                className="wishlist-move-all-btn"
                onClick={handleAddAllToCart}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span>Add All to Bag</span>
              </button>

              <button
                type="button"
                className="wishlist-clear-all-btn"
                onClick={clearWishlist}
              >
                Clear Wishlist
              </button>
            </div>
          )}
        </div>

        {/* ─── EMPTY STATE ─── */}
        {items.length === 0 ? (
          <div className="luxury-wishlist-empty-card">
            <div className="wl-empty-icon-halo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>

            <span className="wl-empty-eyebrow">✦ SIGNATURE ARCHIVES ✦</span>
            <h2 className="wl-empty-title">Your Wishlist is Empty</h2>
            <p className="wl-empty-desc">
              Capture the fragrances that captivate your senses. Select the heart icon on any perfume in our collections to curate your personal scent gallery.
            </p>

            <div className="wl-empty-action-wrap">
              <button
                type="button"
                className="luxury-wishlist-primary-btn"
                onClick={() => navigate("/collections")}
              >
                <span>Discover Fragrances</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* Atelier Luxury Trust Pillars */}
            <div className="wl-empty-perks-strip">
              <div className="wl-empty-perk-item">
                <span className="wl-perk-gold-star">✦</span>
                <span>Complimentary 2ml Extrait with every order</span>
              </div>
              <div className="wl-empty-perk-item">
                <span className="wl-perk-gold-star">✦</span>
                <span>White-Glove Insured Delivery</span>
              </div>
              <div className="wl-empty-perk-item">
                <span className="wl-perk-gold-star">✦</span>
                <span>100% Authentic Master Accords</span>
              </div>
            </div>
          </div>
        ) : (
          /* ─── POPULATED GRID ─── */
          <div className="luxury-wishlist-grid">
            <AnimatePresence>
              {items.map((p) => {
                const defaultVolume =
                  p.prices && p.prices.some((x) => x.volume === "50ml")
                    ? "50ml"
                    : p.prices && p.prices[0]
                    ? p.prices[0].volume
                    : "50ml";
                const variant = buildVariant(p, defaultVolume);
                const img =
                  (p.images && p.images.length > 0 ? p.images[0] : p.imageUrl || p.image) ||
                  "/smoke-fallback.jpg";

                return (
                  <motion.article
                    key={p.id}
                    className="luxury-wishlist-card"
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="wl-card-media">
                      <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        className="wl-card-img"
                      />
                      <button
                        className="wl-card-heart-btn"
                        onClick={() => removeFromWishlist(p.id)}
                        aria-label={`Remove ${p.name} from wishlist`}
                        title="Remove from wishlist"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    </div>

                    <div className="wl-card-body">
                      <div className="wl-card-tag-row">
                        <span className="wl-card-category-tag">
                          {p.category || "EAU DE PARFUM"}
                        </span>
                        <span className="wl-card-volume-tag">
                          {defaultVolume}
                        </span>
                      </div>

                      <h3 className="wl-card-title">{p.name}</h3>

                      {p.description && (
                        <p className="wl-card-desc">{p.description}</p>
                      )}

                      <div className="wl-card-price-row">
                        <span className="wl-card-price">
                          {formatPrice(variant.price)}
                        </span>
                      </div>

                      <div className="wl-card-actions">
                        <button
                          type="button"
                          className="wl-add-cart-btn"
                          onClick={() => addToCart(variant, 1)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                          <span>Add to Bag</span>
                        </button>

                        <button
                          type="button"
                          className="wl-quick-view-btn"
                          onClick={() =>
                            setQuickViewProduct({
                              ...p,
                              selectedVolume: defaultVolume,
                              image: img,
                            })
                          }
                        >
                          Quick View
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {quickViewProduct && (
        <QuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </main>
  );
}
