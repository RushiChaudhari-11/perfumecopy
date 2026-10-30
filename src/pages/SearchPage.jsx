// src/pages/SearchPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { getProductsRealtime, normalizeFirebaseProduct } from "../services/productsService";
import SEO from "../components/SEO";
import "../styles/SearchPage.css";

const TRENDING_TAGS = [
  "Oud",
  "Sandalwood",
  "Cardamom",
  "Bergamot",
  "Amber",
  "Musk",
  "Floral",
  "Citrus",
  "Leather",
];

function formatRupee(val) {
  if (typeof val !== "number") return "";
  const num = val >= 100000 ? Math.round(val / 100) : val;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [products, setProducts] = useState([]);
  const [addedId, setAddedId] = useState(null);

  const { addToCart } = useCart() || {};
  const { toggleWishlist, isWishlisted } = useWishlist() || {};
  const inputRef = useRef(null);

  // Sync directly with real Firestore products
  useEffect(() => {
    let mounted = true;
    const unsub = getProductsRealtime((list) => {
      if (!mounted) return;
      if (Array.isArray(list)) {
        const normalized = list.map((p) => normalizeFirebaseProduct(p));
        setProducts(normalized);
      } else {
        setProducts([]);
      }
    });

    return () => {
      mounted = false;
      if (unsub && typeof unsub === "function") unsub();
    };
  }, []);

  // Sync URL when query changes
  useEffect(() => {
    if (query.trim()) {
      setSearchParams({ q: query.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  // Autofocus search input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();

    let list = products.filter((p) => {
      // Category filter
      if (activeCategory === "men" && p.gender !== "him" && p.gender !== "unisex") return false;
      if (activeCategory === "women" && p.gender !== "her" && p.gender !== "unisex") return false;
      if (activeCategory === "bestsellers" && p.badge !== "BESTSELLER") return false;

      // Query filter
      if (!q) return true;

      const inName = (p.name || "").toLowerCase().includes(q);
      const inSubtitle = (p.subtitle || "").toLowerCase().includes(q);
      const inCategory = (p.category || "").toLowerCase().includes(q);
      const inNotes = (p.notes || "").toLowerCase().includes(q);
      const inGender = q === "men" ? (p.gender === "him" || p.gender === "unisex") : q === "women" ? (p.gender === "her" || p.gender === "unisex") : false;

      return inName || inSubtitle || inCategory || inNotes || inGender;
    });

    // Sorting
    if (sortBy === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [products, query, activeCategory, sortBy]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (addToCart) {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.image,
          volume: "100 ml",
          uniqueId: `${product.id}-100ml`,
        },
        1
      );
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
        price: product.price,
        imageUrl: product.image,
      });
    }
  };

  return (
    <main className="luxury-search-page">
      <SEO
        title={query ? `Search Results for "${query}" | Perfume Copy` : "Search Luxury Fragrances & Accords | Perfume Copy"}
        description="Search artisanal perfumes, extrait de parfums, and rare olfactory notes at Perfume Copy."
        url={query ? `http://www.perfumecopy.com/search?q=${encodeURIComponent(query)}` : "http://www.perfumecopy.com/search"}
      />
      <div className="luxury-search-container">
        {/* Header Breadcrumb / Back */}
        <button
          type="button"
          className="search-back-btn"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>

        {/* ─── Search Hero Header ─── */}
        <div className="search-header-wrap">
          <span className="search-eyebrow">✦ OLFACTORY DISCOVERY ATELIER ✦</span>
          <h1 className="search-page-title">
            Find Your <span className="gold-text">Signature Scent</span>
          </h1>
          <p className="search-page-subtitle">
            Search our private archives by fragrance name, olfactory family, or notes (Oud, Rose, Vanilla, Amber).
          </p>

          {/* Luxury Large Search Bar */}
          <div className="search-input-box">
            <svg className="search-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by perfume, note (e.g. Damascena Rose, Amber, Oud)..."
              className="search-main-input"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Trending Tags */}
          <div className="search-tags-row">
            <span className="tags-label">Trending Searches:</span>
            <div className="tags-list">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`search-tag-pill ${query.toLowerCase() === tag.toLowerCase() ? "active" : ""}`}
                  onClick={() => setQuery(tag)}
                >
                  ✦ {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Filters & Sorting Bar ─── */}
        <div className="search-controls-bar">
          <div className="search-filter-pills">
            <button
              type="button"
              className={`filter-pill ${activeCategory === "all" ? "active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All Scents
            </button>
            <button
              type="button"
              className={`filter-pill ${activeCategory === "men" ? "active" : ""}`}
              onClick={() => setActiveCategory("men")}
            >
              For Him
            </button>
            <button
              type="button"
              className={`filter-pill ${activeCategory === "women" ? "active" : ""}`}
              onClick={() => setActiveCategory("women")}
            >
              For Her
            </button>
            <button
              type="button"
              className={`filter-pill ${activeCategory === "bestsellers" ? "active" : ""}`}
              onClick={() => setActiveCategory("bestsellers")}
            >
              Bestsellers
            </button>
          </div>

          <div className="search-sort-wrap">
            <span className="sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="search-sort-select"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="search-results-info">
          <span>
            Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "fragrance" : "fragrances"}
            {query && <span> for "<strong>{query}</strong>"</span>}
          </span>
        </div>

        {/* ─── Results Grid or Empty State ─── */}
        {filteredProducts.length === 0 ? (
          <div className="search-empty-card">
            <div className="search-empty-halo">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <span className="empty-eyebrow">✦ NO EXACT MATCHES ✦</span>
            <h2 className="empty-title">No Fragrances Found</h2>
            <p className="empty-desc">
              We couldn't find any artisanal extraits matching "<strong>{query}</strong>".
              Try searching by general notes such as <em>Rose, Amber, Vanilla, or Oud</em>.
            </p>
            <div className="empty-btn-wrap">
              <button
                type="button"
                className="search-primary-btn"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
              >
                Clear Search & View All
              </button>
              <button
                type="button"
                className="search-ghost-btn"
                onClick={() => navigate("/collections")}
              >
                Browse Collections
              </button>
            </div>
          </div>
        ) : (
          <div className="search-results-grid">
            <AnimatePresence>
              {filteredProducts.map((prod) => {
                const wishlisted = isWishlisted ? isWishlisted(prod.id) : false;
                const isAdded = addedId === prod.id;
                const discount =
                  prod.originalPrice && prod.originalPrice > prod.price
                    ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                    : null;

                return (
                  <motion.article
                    key={prod.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="search-product-card"
                    onClick={() => navigate(`/products/${prod.slug || prod.id}`, { state: { product: prod } })}
                  >
                    {/* Badge */}
                    {prod.badge && (
                      <span className={`search-badge ${prod.badge === "BESTSELLER" ? "bestseller" : "new"}`}>
                        {prod.badge}
                      </span>
                    )}

                    {/* Bottle Image Frame */}
                    <div className="search-img-frame">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        loading="lazy"
                        className="search-bottle-img"
                      />

                      {/* Floating Wishlist Heart */}
                      <button
                        type="button"
                        className={`search-wishlist-btn ${wishlisted ? "active" : ""}`}
                        onClick={(e) => handleWishlistToggle(prod, e)}
                        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        aria-label="Wishlist"
                      >
                        <svg
                          width="17"
                          height="17"
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

                    {/* Product Body */}
                    <div className="search-card-info">
                      <span className="search-card-cat">{prod.category}</span>
                      <h3 className="search-card-name" title={prod.name}>
                        {prod.name}
                      </h3>

                      {prod.subtitle && (
                        <p className="search-card-notes" title={prod.subtitle}>
                          {prod.subtitle}
                        </p>
                      )}

                      {/* Rating */}
                      <div className="search-card-rating">
                        <span className="stars">★★★★★</span>
                        <span className="rating-val">{prod.rating} ({prod.reviews})</span>
                      </div>

                      {/* Price Row */}
                      <div className="search-card-price-row">
                        <span className="price-val">{formatRupee(prod.price)}</span>
                        {prod.originalPrice && (
                          <span className="orig-price-val">{formatRupee(prod.originalPrice)}</span>
                        )}
                        {discount && (
                          <span className="discount-tag">Save {discount}%</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        className={`search-add-btn ${isAdded ? "added" : ""}`}
                        onClick={(e) => handleAddToCart(prod, e)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        <span>{isAdded ? "Added to Cart ✓" : "Add to Cart"}</span>
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

