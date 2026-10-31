// src/components/TrendingSeason.jsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { getProductsRealtime, normalizeFirebaseProduct, formatPrice } from "../services/productsService";
import "./TrendingSeason.css";

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "bestsellers", label: "Bestsellers" },
  { id: "new-arrivals", label: "New Arrivals" },
  { id: "limited", label: "Limited Edition" },
  { id: "for-him", label: "For Him" },
  { id: "for-her", label: "For Her" },
];

export default function TrendingSeason({ onAddToCart }) {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const scrollbarThumbRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart, addItem, updateQty, getItemQty } = useCart() || {};
  const { toggleWishlist, isWishlisted } = useWishlist() || {};

  // Fetch real Firebase products in real-time
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    const unsub = getProductsRealtime(
      (list) => {
        if (Array.isArray(list)) {
          // Normalize every real Firebase document
          const normalized = list.map((item) => normalizeFirebaseProduct(item));
          setAllProducts(normalized);
        } else {
          setAllProducts([]);
        }
        setLoading(false);
      },
      {
        onError: (err) => {
          console.error("[TrendingSeason] Firebase fetch error:", err);
          setError("Unable to load trending collection from Firebase. Please check your connection.");
          setLoading(false);
        },
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = fetchProducts();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [fetchProducts]);

  // Filter products dynamically from real Firebase fields
  const filteredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const matches = allProducts.filter((prod) => {
      const tags = Array.isArray(prod.tags) ? prod.tags.map((t) => String(t).toLowerCase()) : [];
      const cat = String(prod.category || "").toLowerCase();
      const name = String(prod.name || "").toLowerCase();
      const desc = String(prod.description || "").toLowerCase();

      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "bestsellers") {
        return prod.featured === true || tags.includes("bestseller") || tags.includes("popular") || tags.includes("hot");
      }

      if (activeFilter === "new-arrivals") {
        return tags.includes("new") || prod.isNew || prod.badge === "NEW";
      }

      if (activeFilter === "limited") {
        return (
          tags.includes("limited") ||
          tags.includes("traditional") ||
          tags.includes("oriental") ||
          tags.includes("rich") ||
          tags.includes("signature") ||
          tags.includes("rare")
        );
      }

      if (activeFilter === "for-him") {
        return (
          cat === "men" ||
          tags.includes("men") ||
          tags.includes("masculine") ||
          tags.includes("woody") ||
          tags.includes("leather") ||
          name.includes("men") ||
          desc.includes("masculine") ||
          cat === "unisex"
        );
      }

      if (activeFilter === "for-her") {
        return (
          cat === "women" ||
          tags.includes("women") ||
          tags.includes("feminine") ||
          tags.includes("floral") ||
          tags.includes("rose") ||
          name.includes("women") ||
          desc.includes("feminine") ||
          cat === "unisex"
        );
      }

      return true;
    });

    if (activeFilter === "all") {
      return [...matches].sort((a, b) => {
        const aScore = (a.featured ? 2 : 0) + (a.images?.length > 0 && !a.images[0].startsWith("/") ? 3 : 0);
        const bScore = (b.featured ? 2 : 0) + (b.images?.length > 0 && !b.images[0].startsWith("/") ? 3 : 0);
        return bScore - aScore;
      });
    }

    return matches;
  }, [allProducts, activeFilter]);

  // Update progress bar and arrow availability
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setScrollProgress(progress);
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);

    // Animate GSAP scrollbar thumb smoothly
    if (scrollbarThumbRef.current && scrollbarTrackRef.current) {
      const trackWidth = scrollbarTrackRef.current.clientWidth;
      const thumbWidth = scrollbarThumbRef.current.clientWidth;
      const maxX = trackWidth - thumbWidth;
      const targetX = Math.max(0, Math.min(maxX, progress * maxX));

      gsap.to(scrollbarThumbRef.current, {
        x: targetX,
        duration: 0.15,
        ease: "power1.out",
        overwrite: "auto",
      });
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    updateScrollState();

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, filteredProducts]);

  // Animate cards on filter change
  const handleFilterChange = (catId) => {
    setActiveFilter(catId);
    const el = trackRef.current;
    if (el) {
      gsap.to(el, {
        scrollLeft: 0,
        duration: 0.4,
        ease: "power2.out",
        onUpdate: updateScrollState,
      });
    }

    // GSAP staggered entrance with clearProps so cards are always fully visible
    setTimeout(() => {
      if (trackRef.current) {
        gsap.fromTo(
          trackRef.current.querySelectorAll(".trending-card"),
          { opacity: 0.5, y: 15, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.04, ease: "power2.out", clearProps: "all" }
        );
      }
    }, 50);
  };

  // Smooth Horizontal Scroll using GSAP
  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector(".trending-card");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const gap = 24;
    const cardsToScroll = window.innerWidth <= 768 ? 1 : 2;
    const scrollStep = (cardWidth + gap) * cardsToScroll;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetScroll = Math.max(0, Math.min(maxScroll, el.scrollLeft + scrollStep * direction));

    gsap.to(el, {
      scrollLeft: targetScroll,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: updateScrollState,
      overwrite: "auto",
    });
  };

  // Scrollbar track click navigation
  const handleTrackClick = (e) => {
    const el = trackRef.current;
    const track = scrollbarTrackRef.current;
    if (!el || !track) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const maxScroll = el.scrollWidth - el.clientWidth;

    gsap.to(el, {
      scrollLeft: ratio * maxScroll,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: updateScrollState,
    });
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (!product.inStock) return;

    const currentVolume = selectedVariants[product.id] || product.sizes?.[0] || "50ml";
    const activeVar = (product.variants || []).find((v) => v.volume === currentVolume) || product.variants?.[0] || { price: product.price, volume: "50ml" };

    if (addToCart) {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: activeVar.price,
          imageUrl: product.image,
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
        imageUrl: product.image,
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

  const handleWishlistToggle = (product, e) => {
    e.stopPropagation();
    if (toggleWishlist) {
      toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price * 100,
        imageUrl: product.image,
      });
    }
  };

  return (
    <section
      className="trending-section"
      aria-label="Trending this Season"
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL || ""}/Luxurious Marble and Gold Floral Stage.png")`,
      }}
    >
      <div className="trending-container">
        {/* ─── 1. Elegant Centered Heading ─── */}
        <div className="trending-header">
          <div className="trending-eyebrow">
            <span className="trending-eyebrow-star">✦</span>
            SIGNATURE COLLECTION
            <span className="trending-eyebrow-star">✦</span>
          </div>
          <h2 className="trending-title">
            Trending This <span className="trending-gold-text">Season</span>
          </h2>

          {/* Delicate Gold Decorative Divider */}
          <div className="trending-divider">
            <span className="trending-divider-line" />
            <span className="trending-divider-diamond">✦</span>
            <span className="trending-divider-line" />
          </div>

          <p className="trending-subtitle">
            Discover the fragrances everyone is falling in love with.
          </p>
        </div>

        {/* ─── 2. Functional Category Filters ─── */}
        <div className="trending-filter-bar" role="tablist" aria-label="Product categories">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === cat.id}
              className={`trending-filter-btn ${activeFilter === cat.id ? "active" : ""}`}
              onClick={() => handleFilterChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ─── 3. Carousel Viewport with 4 Cards Per Desktop Row ─── */}
        <div className="trending-carousel-wrapper">
          {/* Left Navigation Arrow */}
          <button
            type="button"
            className="trending-nav-btn prev"
            onClick={() => handleScroll(-1)}
            aria-label="Previous products"
            disabled={!canScrollLeft || loading || filteredProducts.length === 0}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            className="trending-nav-btn next"
            onClick={() => handleScroll(1)}
            aria-label="Next products"
            disabled={!canScrollRight || loading || filteredProducts.length === 0}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Loading Skeleton State */}
          {loading && (
            <div className="trending-track" style={{ overflowX: "hidden" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="trending-card trending-skeleton-card">
                  <div className="trending-img-box skeleton-shimmer" style={{ height: "250px" }} />
                  <div className="trending-info" style={{ gap: "10px", marginTop: "12px" }}>
                    <div className="skeleton-shimmer" style={{ width: "35%", height: "12px" }} />
                    <div className="skeleton-shimmer" style={{ width: "85%", height: "20px" }} />
                    <div className="skeleton-shimmer" style={{ width: "50%", height: "14px" }} />
                    <div className="skeleton-shimmer" style={{ width: "60%", height: "24px", marginTop: "8px" }} />
                    <div className="skeleton-shimmer" style={{ width: "100%", height: "42px", borderRadius: "999px", marginTop: "10px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="trending-error-state">
              <h3 className="trending-error-title">Unable to Load Fragrances</h3>
              <p className="trending-error-desc">{error}</p>
              <button type="button" className="trending-retry-btn" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="trending-empty-state">
              <h3 className="trending-empty-title">No Fragrances Found</h3>
              <p className="trending-empty-desc">
                No active fragrances currently match the selected &quot;{activeFilter}&quot; filter in our Firebase repository.
              </p>
              <button type="button" className="trending-retry-btn" onClick={() => setActiveFilter("all")}>
                View All Fragrances
              </button>
            </div>
          )}

          {/* Real Firebase Cards Track */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div ref={trackRef} className="trending-track">
              {filteredProducts.map((prod) => {
                const wishlisted = isWishlisted ? isWishlisted(prod.id) : false;
                const isAdded = addedId === prod.id;
                const currentVolume = selectedVariants[prod.id] || prod.sizes?.[0] || "50ml";
                const activeVar = (prod.variants || []).find((v) => v.volume === currentVolume) || prod.variants?.[0] || { price: prod.price, originalPrice: prod.originalPrice, volume: "50ml" };
                const displayPrice = activeVar.price;
                const displayOriginalPrice = activeVar.originalPrice;
                const hasDiscount = displayOriginalPrice && displayOriginalPrice > displayPrice;
                const discountPct = hasDiscount ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : null;
                const uid = `${prod.id}-${currentVolume}`;
                const itemQty = getItemQty ? getItemQty(uid) : 0;

                return (
                  <div
                    key={prod.id}
                    className="trending-card"
                    onClick={() => navigate(`/product/${prod.id}`, { state: { product: prod } })}
                  >
                    {/* Real Category/Featured Badge */}
                    {prod.badge && (
                      <span
                        className={`trending-badge ${prod.badge === "BESTSELLER"
                          ? "bestseller"
                          : prod.badge === "LIMITED"
                            ? "limited"
                            : prod.badge === "NEW"
                              ? "new"
                              : "bestseller"
                          }`}
                      >
                        {prod.badge}
                      </span>
                    )}

                    {/* 4K Studio Perfume Image Container — Fixed 250px Stage */}
                    <div className="trending-img-box">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="trending-product-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/collection-perfumes-4k.jpg";
                        }}
                      />

                      {/* Floating Circular Heart Wishlist Button */}
                      <button
                        type="button"
                        className={`trending-wishlist-btn ${wishlisted ? "active" : ""}`}
                        onClick={(e) => handleWishlistToggle(prod, e)}
                        aria-label="Wishlist"
                        title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={wishlisted ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Details with Equalized Box Heights */}
                    <div className="trending-info">
                      <span className="trending-cat">{prod.category}</span>
                      <h3 className="trending-name" title={prod.name}>
                        {prod.name}
                      </h3>

                      {/* Rating Stars - Only displayed if rating exists in Firebase */}
                      {prod.rating !== null ? (
                        <div className="trending-rating">
                          <div className="trending-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>
                                {i < Math.floor(prod.rating) ? "★" : "☆"}
                              </span>
                            ))}
                          </div>
                          <span className="trending-reviews">
                            {prod.rating.toFixed(1)} {prod.reviewsCount !== null ? `(${prod.reviewsCount})` : ""}
                          </span>
                        </div>
                      ) : prod.inspiredBy ? (
                        <div className="trending-rating">
                          <span className="trending-reviews" style={{ opacity: 0.85, fontStyle: "italic" }} title={prod.inspiredBy}>
                            {prod.inspiredBy.length > 35 ? `${prod.inspiredBy.slice(0, 35)}…` : prod.inspiredBy}
                          </span>
                        </div>
                      ) : prod.keyNotes ? (
                        <div className="trending-rating">
                          <span className="trending-reviews" style={{ opacity: 0.8 }} title={prod.keyNotes}>
                            {prod.keyNotes.length > 35 ? `${prod.keyNotes.slice(0, 35)}…` : prod.keyNotes}
                          </span>
                        </div>
                      ) : (
                        <div className="trending-rating">
                          <span className="trending-reviews" style={{ opacity: 0.7 }}>
                            Signature Extrait
                          </span>
                        </div>
                      )}

                      {/* Variant Size Selector (50ml / 100ml) */}
                      <div className="trending-variant-bar" onClick={(e) => e.stopPropagation()}>
                        {(prod.variants && prod.variants.length > 0 ? prod.variants : [{ volume: "50ml" }, { volume: "100ml" }]).map((v) => {
                          const isSelected = currentVolume === v.volume;
                          return (
                            <button
                              key={v.volume}
                              type="button"
                              className={`trending-variant-pill ${isSelected ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVariants((prev) => ({ ...prev, [prod.id]: v.volume }));
                              }}
                            >
                              {v.volume}
                            </button>
                          );
                        })}
                      </div>

                      {/* Real Price and Calculated Discount */}
                      <div className="trending-price-row">
                        <span className="trending-price">
                          {formatPrice(displayPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="trending-original-price">
                            {formatPrice(displayOriginalPrice)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="trending-discount-badge">
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
                          className={`trending-action-btn ${!prod.inStock ? "disabled" : ""}`}
                          onClick={(e) => handleAddToCart(prod, e)}
                          disabled={!prod.inStock}
                        >
                          <span>{!prod.inStock ? "Sold Out" : "Add to Cart"}</span>
                          {prod.inStock && (
                            <span className="trending-btn-arrow-circle">→</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 4. Smooth GSAP Horizontal Scrollbar Track & View All ─── */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="trending-footer-controls">
            <div
              ref={scrollbarTrackRef}
              className="trending-scrollbar-track"
              onClick={handleTrackClick}
              role="scrollbar"
              aria-valuenow={Math.round(scrollProgress * 100)}
              aria-valuemin="0"
              aria-valuemax="100"
              tabIndex={0}
              aria-label="Carousel scroll position"
            >
              <div ref={scrollbarThumbRef} className="trending-scrollbar-thumb" />
            </div>

            <div className="trending-view-all-wrap">
              <button
                type="button"
                className="trending-view-all-btn"
                onClick={() => navigate("/collections/perfumes")}
              >
                <span>View All Collections</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
