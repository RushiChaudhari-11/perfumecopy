// src/ProductsPage.jsx
import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./products.css";
import { getProductsRealtime, formatPrice, normalizeFirebaseProduct } from "./services/productsService";
import { useCart } from "./contexts/CartContext";
import { useWishlist } from "./contexts/WishlistContext";

/* ---------------- CustomSelect (non-native, fully styleable + auto-flip) ---------------- */
function CustomSelect({ id, value, onChange, options = [], placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const computeFlip = () => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return setDropUp(false);

    const btnRect = btn.getBoundingClientRect();

    const prevDisplay = menu.style.display;
    menu.style.display = "block";
    const menuH = menu.offsetHeight;
    menu.style.display = prevDisplay || "";

    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;

    if (spaceBelow < menuH + 8 && spaceAbove > menuH + 8) {
      setDropUp(true);
    } else {
      setDropUp(false);
    }
  };

  useLayoutEffect(() => {
    if (open) {
      requestAnimationFrame(() => computeFlip());
    } else {
      setDropUp(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onChange() {
      if (!open) return;
      computeFlip();
    }
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <div
      id={id}
      ref={rootRef}
      className={`custom-select ${open ? "open" : ""} ${dropUp ? "drop-up" : ""}`}
      aria-expanded={open}
    >
      <button
        type="button"
        ref={btnRef}
        className="select-btn"
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            const firstOpt = menuRef.current && menuRef.current.querySelector("li");
            if (firstOpt) firstOpt.focus();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <span className="caret" aria-hidden="true">
          ▾
        </span>
      </button>

      <ul
        role="listbox"
        tabIndex={-1}
        ref={menuRef}
        className="menu"
        aria-activedescendant={value}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            btnRef.current && btnRef.current.focus();
          }
        }}
      >
        {options.map((opt, idx) => (
          <li
            key={opt.value === "" ? `__empty__-${idx}` : opt.value}
            role="option"
            tabIndex={0}
            aria-selected={opt.value === value}
            aria-current={opt.value === value ? "true" : "false"}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
              btnRef.current && btnRef.current.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
                btnRef.current && btnRef.current.focus();
              } else if (e.key === "ArrowDown") {
                const next = e.currentTarget.nextElementSibling;
                if (next && typeof next.focus === "function") next.focus();
              } else if (e.key === "ArrowUp") {
                const prev = e.currentTarget.previousElementSibling;
                if (prev && typeof prev.focus === "function") prev.focus();
                else btnRef.current && btnRef.current.focus();
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- helper: buildVariant ---------------- */
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

/* ---------------- helper: getOriginalPriceForVolume ---------------- */
const getOriginalPriceForVolume = (product, volume, currentPrice) => {
  const originalEntry =
    product?.originalPrices && product.originalPrices.length > 0
      ? product.originalPrices.find((x) => x.volume === volume)
      : null;

  if (originalEntry?.price && originalEntry.price > currentPrice) {
    return originalEntry.price;
  }

  if (volume === "50ml" && product?.originalPrice && product.originalPrice > currentPrice) {
    return product.originalPrice;
  }

  return null;
};

/* ---------------- ProductMedia component ---------------- */
function ProductMedia({ product, onOpenDetails }) {
  const imgs =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : product?.imageUrl || product?.image
      ? [product.imageUrl || product.image]
      : ["/smoke-fallback.jpg"];

  const [active, setActive] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const timerRef = useRef(null);
  const AUTOPLAY_MS = 3000;

  useEffect(() => {
    if (isHover || imgs.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setActive((a) => (a + 1) % imgs.length);
      }, AUTOPLAY_MS);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isHover, imgs.length]);

  const showAt = (i) => setActive(((i % imgs.length) + imgs.length) % imgs.length);

  return (
    <div
      className="pc-media"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onClick={() => onOpenDetails && onOpenDetails()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpenDetails && onOpenDetails();
      }}
      style={{ cursor: "pointer" }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={`${product.id}-${active}`}
          src={imgs[active]}
          alt={`${product.name} ${active + 1}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          initial={{ opacity: 0, y: 8, scale: 1.02 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.45 }}
        />
      </AnimatePresence>

      <div className="img-shimmer" aria-hidden="true" />

      {imgs.length > 1 && (
        <div className="thumb-row">
          {imgs.slice(0, 5).map((src, idx) => (
            <button
              key={idx}
              className={`thumb-btn ${active === idx ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                showAt(idx);
              }}
              style={{ backgroundImage: `url(${src})` }}
              aria-label={`Show image ${idx + 1} for ${product.name}`}
            />
          ))}
        </div>
      )}

      {product.featured && <div className="pc-badge">Featured</div>}
    </div>
  );
}

/* ---------------- QtyControl — Add to Cart <-> stepper ---------------- */
function QtyControl({ variant, addToCart, updateQty, removeFromCart, cartQty }) {
  if (!cartQty || cartQty <= 0) {
    return (
      <button className="btn small primary" onClick={() => addToCart(variant, 1)}>
        Add to Cart
      </button>
    );
  }

  return (
    <div className="pc-qty-stepper">
      <button
        type="button"
        className="pc-qty-btn"
        onClick={() => {
          if (cartQty <= 1) {
            removeFromCart(variant.uniqueId);
          } else {
            updateQty(variant.uniqueId, cartQty - 1);
          }
        }}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="pc-qty-count">{cartQty}</span>
      <button
        type="button"
        className="pc-qty-btn"
        onClick={() => updateQty(variant.uniqueId, cartQty + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

/* ---------------- ProductsPage main component ---------------- */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(categoryParam || "");
  const [sortBy, setSortBy] = useState("featured");
  const [visible, setVisible] = useState(20);
  const [selectedVolumes, setSelectedVolumes] = useState({});

  const { items: cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    const unsub = getProductsRealtime((arr) =>
      setAll(Array.isArray(arr) ? arr.map((p) => normalizeFirebaseProduct(p, p.id)) : [])
    );
    return () => unsub && typeof unsub === "function" && unsub();
  }, []);

  useEffect(() => {
    if (!all || all.length === 0) return;
    setSelectedVolumes((prev) => {
      const next = { ...prev };
      all.forEach((p) => {
        if (next[p.id]) return;
        const defaultVolume =
          p.prices && p.prices.some((x) => x.volume === "50ml")
            ? "50ml"
            : p.prices && p.prices.length > 0
            ? p.prices[0].volume
            : "50ml";
        next[p.id] = defaultVolume;
      });
      return next;
    });
  }, [all]);

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    all.forEach((p) => (p.tags || []).forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [all]);

  const filtered = all
    .filter((p) => (activeTag ? (p.tags || []).includes(activeTag) : true))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase())
    );

  filtered.sort((a, b) => {
    if (sortBy === "featured") return (b.featured === true) - (a.featured === true);
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const visibleItems = filtered.slice(0, visible);

  const handleVolumeChange = (productId, volume) => {
    setSelectedVolumes((prev) => ({ ...prev, [productId]: volume }));
  };

  return (
    <main className="products-page">
      <header className="products-hero">
        <div className="container">
          <button type="button" className="cp-back" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <span className="pp-eyebrow">Shop</span>

          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            All Perfumes
          </motion.h1>
          <p className="muted">Discover all our scents — search, filter, or sort by your mood.</p>

          <div className="pp-divider" aria-hidden="true" />
          <span className="pp-count-pill">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </span>

          <div className="products-controls">
            <div className="search-wrap">
              <input
                placeholder="Search perfumes, notes, or descriptions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="filters" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <CustomSelect
                id="filter-tags"
                value={activeTag}
                onChange={(val) => setActiveTag(val)}
                placeholder="All moods & families"
                options={[{ value: "", label: "All moods & families" }, ...allTags.map((t) => ({ value: t, label: t }))]}
              />

              <CustomSelect
                id="sort-by"
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={[
                  { value: "featured", label: "Featured" },
                  { value: "price-asc", label: "Price — low to high" },
                  { value: "price-desc", label: "Price — high to low" },
                  { value: "name", label: "Name" },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="products-grid container">
        {visibleItems.length === 0 ? (
          <div className="empty">No products match — try clearing filters or search.</div>
        ) : (
          visibleItems.map((p) => {
            const defaultVolume =
              p.prices && p.prices.some((x) => x.volume === "50ml")
                ? "50ml"
                : p.prices && p.prices[0]
                ? p.prices[0].volume
                : "50ml";

            const selVol = selectedVolumes[p.id] || defaultVolume;
            const variant = buildVariant(p, selVol);
            const wishlisted = isWishlisted(p.id);

            const originalPrice = getOriginalPriceForVolume(p, selVol, variant.price);

            // current qty of THIS exact variant (product + volume) already in cart
            const cartItem = (cartItems || []).find((it) => it.uniqueId === variant.uniqueId);
            const cartQty = cartItem ? cartItem.qty : 0;

            return (
              <motion.article
                key={p.id}
                className="product-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div style={{ position: "relative" }}>
                  <ProductMedia
                    product={p}
                    onOpenDetails={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                  />
                  <button
                    className={`wishlist-btn ${wishlisted ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(p);
                    }}
                    aria-label={wishlisted ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                    title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {wishlisted ? "♥" : "♡"}
                  </button>
                </div>

                <div className="pc-body">
                  <h3>{p.name}</h3>

                  <div className="pc-foot">
                    <div className="pc-vol-price-row">
                      {p.prices && p.prices.length > 0 ? (
                        <CustomSelect
                          id={`volume-${p.id}`}
                          value={selVol}
                          onChange={(val) => handleVolumeChange(p.id, val)}
                          options={p.prices.map((pr) => ({
                            value: pr.volume,
                            label: `${pr.volume}: ${formatPrice(pr.price)}`,
                          }))}
                        />
                      ) : (
                        <div className="muted small">50ml</div>
                      )}

                      {originalPrice && (
                        <div className="price-block">
                          <div className="price-original">{formatPrice(originalPrice)}</div>
                        </div>
                      )}
                    </div>

                    <div className="actions vertical">
                      <QtyControl
                        variant={variant}
                        addToCart={addToCart}
                        updateQty={updateQty}
                        removeFromCart={removeFromCart}
                        cartQty={cartQty}
                      />
                      <button
                        className="btn small ghost view-btn"
                        onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
      </section>

      <div className="container actions-row">
        {visible < filtered.length ? (
          <button className="btn ghost" onClick={() => setVisible((s) => s + 20)}>
            Load More
          </button>
        ) : filtered.length > 0 ? (
          <div className="muted">End of collection</div>
        ) : null}
      </div>
    </main>
  );
}