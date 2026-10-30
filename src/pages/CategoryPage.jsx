// src/pages/CategoryPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProductsByCategoryRealtime, normalizeFirebaseProduct, formatPrice } from "../services/productsService";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import SEO from "../components/SEO";
import "../styles/CategoryLuxury.css";

const CATEGORY_META = {
  men: {
    title: "Perfumes for Men",
    subtitle: "Explore our curated repertoire of luxury extraits and masculine accords.",
    banner: "/men-hero-banner.png",
    ticker: "SHOP PERFUMES FOR MEN | GRAB THE OFFER BUY 1 GET 1 FREE",
  },
  women: {
    title: "Perfumes for Women",
    subtitle: "Discover sublime floral bouquets, intoxicating ambers, and feminine elixirs.",
    banner: "/hero-banner.jpg",
    ticker: "SHOP PERFUMES FOR WOMEN | GRAB THE OFFER BUY 1 GET 1 FREE",
  },
  unisex: {
    title: "Unisex Haute Parfumerie",
    subtitle: "Transcendent signature fragrances designed for every discerning connoisseur.",
    banner: "/collection-perfumes-4k.jpg",
    ticker: "SHOP UNISEX EXTRAITS | COMPLIMENTARY EXPRESS SHIPPING",
  },
  perfumes: {
    title: "Luxury Perfumes & Extraits",
    subtitle: "Small-batch artisanal extraits and pure parfums with 30% concentration.",
    banner: "/collection-perfumes-4k.jpg",
    ticker: "HAUTE PARFUMERIE COLLECTION | GRAB THE OFFER BUY 1 GET 1 FREE",
  },
  "nano-freshners": {
    title: "Nano Fresheners & Pocket Luxe",
    subtitle: "Ultra-portable 10ml travel extraits and pocket fresheners for on-the-go luxury.",
    banner: "/collection-nano-4k.jpg",
    ticker: "POCKET LUXE COLLECTION | BUY 2 GET 1 COMPLIMENTARY",
  },
  nano: {
    title: "Nano Fresheners & Pocket Luxe",
    subtitle: "Ultra-portable 10ml travel extraits and pocket fresheners for on-the-go luxury.",
    banner: "/collection-nano-4k.jpg",
    ticker: "POCKET LUXE COLLECTION | BUY 2 GET 1 COMPLIMENTARY",
  },
  "gift-sets": {
    title: "Exclusive Gift Sets & Discovery Kits",
    subtitle: "Opulent presentation coffrets, miniature discovery sets, and curated duos.",
    banner: "/collection-giftsets-4k.jpg",
    ticker: "ROYAL DISCOVERY SETS | COMPLIMENTARY LUXURY GIFT PACKAGING",
  },
  "air-fresheners": {
    title: "Botanical Air Fresheners & Room Mists",
    subtitle: "Infuse your sanctuary, linens, and vehicles with artisanal botanical atmospheres.",
    banner: "/collection-airfresheners-4k.jpg",
    ticker: "BOTANICAL ATMOSPHERE MISTS | DISCOVER REFRESHING SCENTS",
  },
  deodorants: {
    title: "Signature Perfumed Deodorants",
    subtitle: "All-day freshness infused with master perfumery fragrance compounds.",
    banner: "/collection-deodorants-4k.jpg",
    ticker: "ALL-DAY PERFUMED DEODORANTS | BUY 2 GET 15% OFF",
  },
  "body-talc": {
    title: "French Fragrance Body Talc",
    subtitle: "Silk-spun micro-fine deodorant talc perfumed with French botanical essences.",
    banner: "/collection-bodytalc-4k.jpg",
    ticker: "FRENCH SILK BODY TALC | DERMATOLOGICALLY TESTED",
  },
  all: {
    title: "All Luxury Perfumes & Extraits",
    subtitle: "Explore our complete curated repertoire of handcrafted artisanal extraits.",
    banner: "/collection-perfumes-4k.jpg",
    ticker: "HAUTE PARFUMERIE COLLECTION | GRAB THE OFFER BUY 1 GET 1 FREE",
  },
  shop: {
    title: "All Luxury Perfumes & Extraits",
    subtitle: "Explore our complete curated repertoire of handcrafted artisanal extraits.",
    banner: "/collection-perfumes-4k.jpg",
    ticker: "HAUTE PARFUMERIE COLLECTION | GRAB THE OFFER BUY 1 GET 1 FREE",
  },
};

const FALLBACK_BOTTLES = [
  "/occasion-aura-ozone-4k.jpg",
  "/occasion-aura-metal-4k.jpg",
  "/occasion-aura-alp-4k.jpg",
  "/collection-perfumes-4k.jpg",
  "/collection-deodorants-4k.jpg",
  "/bottle-trans-gold.png",
  "/bottle-trans-ruby.png",
  "/bottle-trans-amethyst.png",
];

const FRAGRANCE_FAMILIES = [
  "Amber Spicy",
  "Aromatic Aquatic Fragrance",
  "Aromatic Fougere Fragrance",
  "Aromatic Spicy Fragrance",
  "Aromatic Woody",
  "Chypre Fruity Fragrance",
  "Chypre Woody Fragrance",
  "Floral Aromatic Fragrance",
  "Floral Fruity Fragrance",
  "Sweet Spicy Wood",
];

const NOTES_LIST = ["Citrus", "Woody", "Floral", "Oriental", "Fresh", "Leather", "Oud", "Amber"];
const STYLES_LIST = ["Luxury", "Casual", "Party", "Office", "Evening"];
const SIZES_LIST = ["100ml", "50ml", "250ml", "20ml"];

export default function CategoryPage() {
  const { category = "men" } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQty, getItemQty } = useCart() || {};
  const { toggleWishlist, isWishlisted } = useWishlist() || {};

  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});

  // Accordion Expand/Collapse State
  const [openAccordions, setOpenAccordions] = useState({
    family: true,
    notes: false,
    style: false,
    size: false,
    price: false,
    availability: false,
  });

  // Filters State
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [sortBy, setSortBy] = useState("best-selling");
  const [showMoreFamilies, setShowMoreFamilies] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeFiltersCount =
    selectedFamilies.length +
    selectedNotes.length +
    selectedStyles.length +
    selectedSizes.length +
    (selectedPriceRange ? 1 : 0) +
    (selectedAvailability ? 1 : 0);

  // Fetch Firestore Realtime Products
  useEffect(() => {
    setLoading(true);
    const unsub = getProductsByCategoryRealtime(category, (list) => {
      setDbProducts(Array.isArray(list) ? list : []);
      setLoading(false);
    });
    return () => unsub && typeof unsub === "function" && unsub();
  }, [category]);

  // Normalize real Firebase products
  const allProducts = useMemo(() => {
    if (!Array.isArray(dbProducts) || dbProducts.length === 0) return [];
    return dbProducts.map((dbItem) => normalizeFirebaseProduct(dbItem));
  }, [dbProducts]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    // Filter Fragrance Family
    if (selectedFamilies.length > 0) {
      list = list.filter((p) => selectedFamilies.includes(p.fragranceFamily));
    }

    // Filter Notes
    if (selectedNotes.length > 0) {
      list = list.filter((p) => selectedNotes.includes(p.notes));
    }

    // Filter Style
    if (selectedStyles.length > 0) {
      list = list.filter((p) => selectedStyles.includes(p.style));
    }

    // Filter Size
    if (selectedSizes.length > 0) {
      list = list.filter((p) => selectedSizes.includes(p.size));
    }

    // Filter Price
    if (selectedPriceRange === "under-500") list = list.filter((p) => p.price < 500);
    else if (selectedPriceRange === "500-1000") list = list.filter((p) => p.price >= 500 && p.price <= 1000);
    else if (selectedPriceRange === "1000-1500") list = list.filter((p) => p.price >= 1000 && p.price <= 1500);
    else if (selectedPriceRange === "above-1500") list = list.filter((p) => p.price > 1500);

    // Filter Availability
    if (selectedAvailability === "in-stock") list = list.filter((p) => p.inStock);
    else if (selectedAvailability === "sold-out") list = list.filter((p) => !p.inStock);

    // Sort
    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "best-selling") list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

    return list;
  }, [
    allProducts,
    selectedFamilies,
    selectedNotes,
    selectedStyles,
    selectedSizes,
    selectedPriceRange,
    selectedAvailability,
    sortBy,
  ]);

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleArrayFilter = (item, stateList, setFn) => {
    if (stateList.includes(item)) {
      setFn(stateList.filter((x) => x !== item));
    } else {
      setFn([...stateList, item]);
    }
  };

  const meta = CATEGORY_META[category] || {
    title: category ? category.replace(/-/g, " ").toUpperCase() : "Perfumes Collection",
    subtitle: "Explore our curated repertoire of luxury extraits and perfumed essentials.",
    banner: "/collection-perfumes-4k.jpg",
    ticker: `SHOP ${category.toUpperCase()} | GRAB THE OFFER BUY 1 GET 1 FREE`,
  };

  const pageTitle = meta.title;

  return (
    <div className="cat-luxury-page">
      <SEO
        title={`${pageTitle} | Perfume Copy`}
        description={meta.subtitle}
        image={meta.banner}
        url={`http://www.perfumecopy.com/collections/${category}`}
      />
      {/* 1. Top Offer Ticker Bar (Matching User Screenshot) */}
      <div className="cat-luxury-ticker" aria-hidden="true">
        <div className="cat-luxury-ticker-track">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="cat-luxury-ticker-item">
              <span className="cat-ticker-star">✦</span>
              <span>{meta.ticker}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Hero Section Banner */}
      <section className="cat-hero-banner-section" aria-label="Category Hero Showcase">
        <div className="cat-hero-banner-container">
          <img
            src={meta.banner}
            alt={meta.title}
            className="cat-hero-banner-img"
            loading="eager"
          />
        </div>
      </section>

      <div className="cat-luxury-container">
        {/* 3. Page Header & Breadcrumbs */}
        <header className="cat-luxury-header">
          <h1 className="cat-luxury-title">{pageTitle}</h1>
          <div className="cat-luxury-breadcrumbs-row">
            <nav className="cat-luxury-breadcrumbs" aria-label="Breadcrumbs">
              <Link to="/">Home</Link>
              <span>/</span>
              <span className="active">{pageTitle}</span>
            </nav>

            {/* Sort Dropdown, Mobile Filter Trigger & Product Count */}
            <div className="cat-luxury-controls">
              <button
                type="button"
                className="cat-mobile-filter-trigger"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filter sidebar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
              </button>

              <div className="cat-sort-wrap">
                <label htmlFor="cat-sort">Sort by</label>
                <select
                  id="cat-sort"
                  className="cat-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="best-selling">Best selling</option>
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price, low to high</option>
                  <option value="price-desc">Price, high to low</option>
                  <option value="name">Alphabetically, A-Z</option>
                </select>
              </div>

              <span className="cat-count-badge">{filteredProducts.length} products</span>
            </div>
          </div>
        </header>

        {/* Mobile Filter Backdrop */}
        {mobileFilterOpen && (
          <div
            className="cat-sidebar-overlay"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 3. Two-Column Layout (Sidebar + Main Grid) */}
        <div className="cat-luxury-layout">
          {/* Left Sidebar: Collapsible Accordion Filters */}
          <aside className={`cat-luxury-sidebar ${mobileFilterOpen ? "mobile-open" : ""}`}>
            <div className="cat-sidebar-mobile-header">
              <span className="cat-sidebar-mobile-title">Filter Products</span>
              <button
                type="button"
                className="cat-sidebar-mobile-close"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            {/* Fragrance Family */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("family")}
              >
                <span>SHOP BY FRAGRANCE FAMILY</span>
                <span className="cat-filter-icon">{openAccordions.family ? "−" : "+"}</span>
              </button>
              {openAccordions.family && (
                <div className="cat-filter-options">
                  {(showMoreFamilies ? FRAGRANCE_FAMILIES : FRAGRANCE_FAMILIES.slice(0, 7)).map(
                    (fam) => (
                      <label key={fam} className="cat-filter-label">
                        <input
                          type="checkbox"
                          className="cat-filter-checkbox"
                          checked={selectedFamilies.includes(fam)}
                          onChange={() =>
                            toggleArrayFilter(fam, selectedFamilies, setSelectedFamilies)
                          }
                        />
                        <span>{fam}</span>
                      </label>
                    )
                  )}
                  <button
                    type="button"
                    className="cat-show-more-btn"
                    onClick={() => setShowMoreFamilies(!showMoreFamilies)}
                  >
                    {showMoreFamilies ? "SHOW LESS" : "SHOW MORE"}
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("notes")}
              >
                <span>SHOP BY NOTES</span>
                <span className="cat-filter-icon">{openAccordions.notes ? "−" : "+"}</span>
              </button>
              {openAccordions.notes && (
                <div className="cat-filter-options">
                  {NOTES_LIST.map((note) => (
                    <label key={note} className="cat-filter-label">
                      <input
                        type="checkbox"
                        className="cat-filter-checkbox"
                        checked={selectedNotes.includes(note)}
                        onChange={() => toggleArrayFilter(note, selectedNotes, setSelectedNotes)}
                      />
                      <span>{note}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Style */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("style")}
              >
                <span>SHOP BY STYLE</span>
                <span className="cat-filter-icon">{openAccordions.style ? "−" : "+"}</span>
              </button>
              {openAccordions.style && (
                <div className="cat-filter-options">
                  {STYLES_LIST.map((st) => (
                    <label key={st} className="cat-filter-label">
                      <input
                        type="checkbox"
                        className="cat-filter-checkbox"
                        checked={selectedStyles.includes(st)}
                        onChange={() => toggleArrayFilter(st, selectedStyles, setSelectedStyles)}
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Size */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("size")}
              >
                <span>SHOP BY SIZE</span>
                <span className="cat-filter-icon">{openAccordions.size ? "−" : "+"}</span>
              </button>
              {openAccordions.size && (
                <div className="cat-filter-options">
                  {SIZES_LIST.map((sz) => (
                    <label key={sz} className="cat-filter-label">
                      <input
                        type="checkbox"
                        className="cat-filter-checkbox"
                        checked={selectedSizes.includes(sz)}
                        onChange={() => toggleArrayFilter(sz, selectedSizes, setSelectedSizes)}
                      />
                      <span>{sz}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("price")}
              >
                <span>SHOP BY PRICE</span>
                <span className="cat-filter-icon">{openAccordions.price ? "−" : "+"}</span>
              </button>
              {openAccordions.price && (
                <div className="cat-filter-options">
                  {[
                    { id: "under-500", label: "Under Rs. 500" },
                    { id: "500-1000", label: "Rs. 500 - Rs. 1,000" },
                    { id: "1000-1500", label: "Rs. 1,000 - Rs. 1,500" },
                    { id: "above-1500", label: "Above Rs. 1,500" },
                  ].map((pr) => (
                    <label key={pr.id} className="cat-filter-label">
                      <input
                        type="radio"
                        name="price-filter"
                        className="cat-filter-checkbox"
                        checked={selectedPriceRange === pr.id}
                        onChange={() =>
                          setSelectedPriceRange(selectedPriceRange === pr.id ? "" : pr.id)
                        }
                      />
                      <span>{pr.label}</span>
                    </label>
                  ))}
                  {selectedPriceRange && (
                    <button
                      type="button"
                      className="cat-show-more-btn"
                      onClick={() => setSelectedPriceRange("")}
                    >
                      Clear Price
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="cat-filter-section">
              <button
                type="button"
                className="cat-filter-heading"
                onClick={() => toggleAccordion("availability")}
              >
                <span>SHOP BY AVAILABILITY</span>
                <span className="cat-filter-icon">{openAccordions.availability ? "−" : "+"}</span>
              </button>
              {openAccordions.availability && (
                <div className="cat-filter-options">
                  {[
                    { id: "in-stock", label: "In Stock" },
                    { id: "sold-out", label: "Sold Out" },
                  ].map((av) => (
                    <label key={av.id} className="cat-filter-label">
                      <input
                        type="radio"
                        name="avail-filter"
                        className="cat-filter-checkbox"
                        checked={selectedAvailability === av.id}
                        onChange={() =>
                          setSelectedAvailability(selectedAvailability === av.id ? "" : av.id)
                        }
                      />
                      <span>{av.label}</span>
                    </label>
                  ))}
                  {selectedAvailability && (
                    <button
                      type="button"
                      className="cat-show-more-btn"
                      onClick={() => setSelectedAvailability("")}
                    >
                      Clear Availability
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Right Main Grid: Products matching user screenshot */}
          <main className="cat-luxury-main">
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#C89B52" }}>
                <p style={{ fontSize: "16px", letterSpacing: "1px" }}>Curating signature fragrances...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ color: "#64748b", fontSize: "16px" }}>
                  No products found matching the selected filters.
                </p>
                <button
                  type="button"
                  className="cat-card-btn"
                  style={{ maxWidth: "200px", margin: "16px auto 0" }}
                  onClick={() => {
                    setSelectedFamilies([]);
                    setSelectedNotes([]);
                    setSelectedStyles([]);
                    setSelectedSizes([]);
                    setSelectedPriceRange("");
                    setSelectedAvailability("");
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="cat-products-grid">
                {filteredProducts.map((p, idx) => {
                  const wish = isWishlisted ? isWishlisted(p.id) : false;
                  const currentVolume = selectedVariants[p.id] || p.sizes?.[0] || "50ml";
                  const activeVar =
                    (p.variants || []).find((v) => v.volume === currentVolume) ||
                    p.variants?.[0] || { price: p.price, originalPrice: p.originalPrice, volume: "50ml" };
                  const displayPrice = activeVar.price;
                  const displayOriginalPrice = activeVar.originalPrice;
                  const hasDiscount = displayOriginalPrice && displayOriginalPrice > displayPrice;
                  const discountPct = hasDiscount
                    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
                    : null;
                  const uid = `${p.id}-${currentVolume}`;
                  const itemQty = getItemQty ? getItemQty(uid) : 0;

                  return (
                    <article key={p.id} className="cat-luxury-card">
                      {/* Media Image Box */}
                      <div
                        className="cat-card-media"
                        onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                      >
                        {p.badge && (
                          <span
                            className={`cat-card-badge ${
                              p.badge === "SOLD OUT"
                                ? "sold-out"
                                : p.badge.includes("OFF")
                                ? "sale"
                                : ""
                            }`}
                          >
                            {p.badge}
                          </span>
                        )}

                        <button
                          className={`cat-wish-btn ${wish ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (toggleWishlist) toggleWishlist(p);
                          }}
                          aria-label="Wishlist toggle"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={wish ? "#d97706" : "none"}
                            stroke={wish ? "#d97706" : "#64748b"}
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        <img
                          src={p.image}
                          alt={p.name}
                          className="cat-card-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              FALLBACK_BOTTLES[idx % FALLBACK_BOTTLES.length];
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="cat-card-info">
                        <span className="cat-card-category">{p.category}</span>
                        <h2
                          className="cat-card-name"
                          title={p.name}
                          onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                        >
                          {p.name}
                        </h2>

                        {/* Star Rating */}
                        <div className="cat-card-rating">
                          <span className="cat-stars-gold">
                            {"★".repeat(Math.round(p.rating || 5))}
                          </span>
                          <span className="cat-stars-grey">
                            {"★".repeat(5 - Math.round(p.rating || 5))}
                          </span>
                          <span className="cat-rating-text">
                            {p.rating} ({p.reviews || 0} Reviews)
                          </span>
                        </div>

                        {/* Variant Selection Bar (e.g. 50ml / 100ml) */}
                        <div className="cat-variant-bar" onClick={(e) => e.stopPropagation()}>
                          {(p.variants && p.variants.length > 0
                            ? p.variants
                            : [
                                { volume: "50ml", price: p.price, originalPrice: p.originalPrice },
                                {
                                  volume: "100ml",
                                  price: Math.round(p.price * 1.8),
                                  originalPrice: p.originalPrice ? Math.round(p.originalPrice * 1.8) : null,
                                },
                              ]
                          ).map((v) => {
                            const isSelected = currentVolume === v.volume;
                            return (
                              <button
                                key={v.volume}
                                type="button"
                                className={`cat-variant-pill ${isSelected ? "active" : ""}`}
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

                        {/* Price */}
                        <div className="cat-card-price-row">
                          <span className="cat-card-price">
                            {formatPrice(displayPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="cat-card-original-price">
                              {formatPrice(displayOriginalPrice)}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="cat-card-discount-badge">
                              Save {discountPct}%
                            </span>
                          )}
                        </div>

                        {/* Add to Cart Button or Stepper */}
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
                            className={`cat-card-btn ${!p.inStock ? "sold-out" : ""}`}
                            disabled={!p.inStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!p.inStock) return;
                              if (addToCart) {
                                addToCart(
                                  {
                                    id: p.id,
                                    name: p.name,
                                    price: displayPrice,
                                    imageUrl: p.image,
                                    volume: currentVolume,
                                    uniqueId: uid,
                                  },
                                  1
                                );
                              }
                            }}
                          >
                            <span>{p.inStock ? "Add to Cart" : "SOLD OUT"}</span>
                            {p.inStock && <span className="cat-card-arrow-circle">→</span>}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
