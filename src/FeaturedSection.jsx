import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./featured.css";
import { getFeaturedProductsRealtime, formatPrice } from "./services/productsService";
import { useNavigate } from "react-router-dom";
import { useCart } from "./contexts/CartContext";
import { useWishlist } from "./contexts/WishlistContext";

export default function FeaturedSection({ count = 8, groupSize = 4, intervalMs = 4000 }) {
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    const unsub = getFeaturedProductsRealtime((data) => {
      setFeatured(Array.isArray(data) ? data : []);
    });
    return () => unsub && typeof unsub === "function" && unsub();
  }, []);

  // Take up to `count` products (used by the mobile carousel, which still
  // scrolls through all of them).
  const displayed = useMemo(() => featured.slice(0, count), [featured, count]);

  // DESKTOP/TABLET: static — always just the first 4, no rotation, no dots.
  const desktopProducts = useMemo(() => featured.slice(0, groupSize), [featured, groupSize]);

  return (
    <section
      id="featured-collections"
      className="featured-section"
      aria-labelledby="featured-title"
    >
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 id="featured-title" className="section-title">
            Featured Collection
          </h2>
          <p className="section-sub">Handpicked scents that define the season.</p>
        </motion.div>

        {/* ── DESKTOP / TABLET: static grid, first 4 products only, no auto-rotate ── */}
        <div className="featured-desktop-grid">
          <div className="grid">
            {desktopProducts.map((p, i) => (
              <FeaturedCard
                key={p.id}
                product={p}
                index={i}
                onView={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                onAdd={() => addToCart(p, 1)}
              />
            ))}
          </div>
        </div>

        {/* ── MOBILE ONLY: one-card-at-a-time auto-sliding swipeable carousel (unchanged) ── */}
        <div className="featured-mobile-carousel">
          <MobileCarousel
            products={displayed}
            intervalMs={intervalMs}
            onView={(p) => navigate(`/product/${p.id}`, { state: { product: p } })}
            onAdd={(p) => addToCart(p, 1)}
          />
        </div>

        <motion.div
          className="view-all"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button className="btn ghost" onClick={() => navigate("/collections/perfumes")}>
            View All →
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Mobile auto-sliding carousel (unchanged) ───────────────────────────────
// Native horizontal scroll-snap track (no external swiper library needed):
//   - Auto-advances one card at a time every `intervalMs`.
//   - Manual swipe/drag works natively (it's just a scrollable track), and
//     pauses autoplay briefly so it doesn't fight the user's gesture.
//   - Dots stay in sync with whichever card is actually in view, whether it
//     got there by autoplay or by the user's own swipe.
function MobileCarousel({ products, intervalMs = 4000, onView = () => {}, onAdd = () => {} }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const isPausedRef = useRef(false);
  const scrollDebounceRef = useRef(null);
  const resumeTimeoutRef = useRef(null);

  const getStep = () => {
    const track = trackRef.current;
    if (!track || !products.length) return 0;
    // Average per-slide scroll distance (slide width + gap), measured from
    // actual layout rather than assumed, so the peek width doesn't matter.
    return track.scrollWidth / products.length;
  };

  const scrollToIndex = (i, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    track.scrollTo({ left: i * step, behavior: smooth ? "smooth" : "auto" });
  };

  // Autoplay
  useEffect(() => {
    if (!products.length || products.length <= 1) return;
    const id = setInterval(() => {
      if (isPausedRef.current) return;
      setIndex((prev) => {
        const next = (prev + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, intervalMs]);

  // Keep the dot indicator synced when the user manually swipes
  const handleScrollSettled = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep() || 1;
    const i = Math.round(track.scrollLeft / step);
    setIndex(i);
  };

  const onScroll = () => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(handleScrollSettled, 80);
  };

  const pauseAutoplay = () => { isPausedRef.current = true; };
  const resumeAutoplay = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    // small grace period so autoplay doesn't yank the track right after
    // the user lets go mid-swipe
    resumeTimeoutRef.current = setTimeout(() => { isPausedRef.current = false; }, 1500);
  };

  // Re-align to the current slide on orientation change / resize
  useEffect(() => {
    const onResize = () => scrollToIndex(index, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!products.length) return null;

  return (
    <div className="mobile-carousel-wrap">
      <div
        className="mobile-carousel-track"
        ref={trackRef}
        onScroll={onScroll}
        onTouchStart={pauseAutoplay}
        onTouchEnd={resumeAutoplay}
        onMouseDown={pauseAutoplay}
        onMouseUp={resumeAutoplay}
      >
        {products.map((p, i) => (
          <div className="mobile-carousel-slide" key={p.id}>
            <FeaturedCard
              product={p}
              index={i}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
            />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <div className="grid-swap-dots mobile-carousel-dots" role="tablist" aria-label="Featured products">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show product ${i + 1}`}
              className={`grid-swap-dot ${i === index ? "active" : ""}`}
              onClick={() => { setIndex(i); scrollToIndex(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating = 5, reviewCount }) {
  const full = Math.round(rating);
  return (
    <div className="stars" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`star ${i < full ? "filled" : "empty"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6L1.3 7.7l6.1-.6z" />
        </svg>
      ))}
      {reviewCount ? <span className="review-count">({reviewCount})</span> : null}
    </div>
  );
}

export function FeaturedCard({ product, index = 0, onView = () => {}, onAdd = () => {} }) {
  const imgs = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : product?.imageUrl ? [product.imageUrl] : ["/smoke-fallback.jpg"];

  const [active, setActive] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const timerRef = useRef(null);
  const AUTOPLAY_MS = 3200;

  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    if (isHover) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setActive((a) => (a + 1) % imgs.length);
      }, AUTOPLAY_MS);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [imgs.length, isHover]);

  const showAt = (i) => setActive(i % imgs.length);

  const priceValue = (() => {
    if (Array.isArray(product?.prices) && product.prices.length > 0) return product.prices[0].price;
    return product?.price || 0;
  })();

  const originalPrice = product?.originalPrice && product.originalPrice > priceValue
    ? product.originalPrice
    : null;

  const badge = product?.badge || (product?.bestseller ? "Bestseller" : null);
  const rating = product?.rating ?? 5;

  return (
    <motion.article
      className="featured-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ translateY: -4 }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className="fc-media" style={{ cursor: "pointer" }} onClick={onView}>
        {badge && <span className="badge-ribbon">{badge}</span>}

        <button
          type="button"
          className={`heart-btn ${wishlisted ? "active" : ""}`}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7.2-4.5-9.8-9C.6 8.8 1.6 5.5 4.6 4.4c2.1-.8 4.3 0 5.6 1.8.4.5.7 1 .9 1.4.2-.4.5-.9.9-1.4C13.3 4.4 15.5 3.6 17.6 4.4c3 1.1 4 4.4 2.4 7.6-2.6 4.5-9.8 9-9.8 9z" />
          </svg>
        </button>

        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={`${product.id}-${active}`}
            src={imgs[active]}
            alt={`${product.name} - ${active + 1}`}
            className="fc-img"
            initial={{ opacity: 0, y: 8, scale: 1.03 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.45 }}
            loading="lazy"
          />
        </AnimatePresence>
        <div className="img-shimmer" aria-hidden="true" />

        {imgs.length > 1 && (
          <div className="thumb-row">
            {imgs.slice(0, 5).map((src, idx) => (
              <button
                key={idx}
                className={`thumb-btn ${active === idx ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); showAt(idx); }}
                aria-label={`Show image ${idx + 1} for ${product.name}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fc-body">
        <h3>{product.name}</h3>

        <StarRating rating={rating} reviewCount={product?.reviewCount} />

        <div className="fc-foot">
          <div className="price-block">
            <div className="price">{formatPrice(priceValue)}</div>
            {originalPrice && (
              <div className="price-original">{formatPrice(originalPrice)}</div>
            )}
          </div>
          <div className="fc-actions">
            <button className="btn discover" onClick={onView} aria-label={`View ${product.name}`}>
              Discover
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
