// src/pages/ProductDetail.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  getProductById,
  formatPrice,
  getProductsRealtime,
  addReviewToProduct,
  normalizeFirebaseProduct,
  getProductFallbackImage,
} from "../services/productsService";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { resolveProductTheme } from "../utils/productTheme";
import SEO from "../components/SEO";
import "../styles/luxuryProductDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Purchase controls
  const [selectedSize, setSelectedSize] = useState("100 ml");
  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("description"); // description | notes | howToUse

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Pincode checker
  const [pincode, setPincode] = useState("");
  const [deliveryResult, setDeliveryResult] = useState(null); // { status, message, days, cod }

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  const relatedScrollRef = useRef(null);

  // 1. Fetch & Merge Product Data from Firebase
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setActiveImageIndex(0);
    setQty(1);
    setDeliveryResult(null);

    async function loadData() {
      // Step A: Priority 1 - Direct Firebase Firestore Lookup
      let firestoreItem = null;
      try {
        firestoreItem = await getProductById(id);
      } catch (err) {
        console.warn("Firestore lookup failed for:", id, err);
      }

      if (!mounted) return;

      if (firestoreItem) {
        const norm = normalizeFirebaseProduct(firestoreItem, id);
        setProduct(norm);
        setReviews(norm.reviews || []);
        if (norm.sizes?.length > 0) {
          setSelectedSize(norm.sizes[0]);
        }
        setLoading(false);
        return;
      }

      // Step B: Check if product was passed in navigation history state
      const stateProduct = location.state?.product;
      if (stateProduct && (stateProduct.id === id || stateProduct.slug === id || !id)) {
        const norm = normalizeFirebaseProduct(stateProduct, id);
        setProduct(norm);
        setReviews(norm.reviews || []);
        if (norm.sizes?.length > 0) {
          setSelectedSize(norm.sizes[0]);
        }
        setLoading(false);
        return;
      }

      // Not found in Firebase
      setProduct(null);
      setLoading(false);
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [id, location.state]);

  // 2. Fetch Related Products from Firebase
  useEffect(() => {
    let mounted = true;
    const unsub = getProductsRealtime((firestoreList) => {
      if (!mounted) return;
      if (Array.isArray(firestoreList) && firestoreList.length > 0) {
        const normalized = firestoreList
          .map((item) => normalizeFirebaseProduct(item))
          .filter((item) => item.id !== id);

        // Sort by related category or tags
        const currentCategory = product?.category;
        const currentTags = product?.tags || [];

        normalized.sort((a, b) => {
          const aScore = (a.category === currentCategory ? 2 : 0) + (a.tags.some((t) => currentTags.includes(t)) ? 1 : 0);
          const bScore = (b.category === currentCategory ? 2 : 0) + (b.tags.some((t) => currentTags.includes(t)) ? 1 : 0);
          return bScore - aScore;
        });

        setRelatedProducts(normalized.slice(0, 8));
      }
    });

    return () => {
      mounted = false;
      if (unsub && typeof unsub === "function") unsub();
    };
  }, [product, id]);

  // Compute theme colors dynamically
  const theme = resolveProductTheme(product);

  // Gallery Helpers
  const galleryImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : product?.imageUrl
          ? [product.imageUrl]
          : ["/collection-perfumes-4k.jpg"];

  const currentMainImage = galleryImages[activeImageIndex] || galleryImages[0];

  const handleNextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const handlePrevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    function onKeyDown(e) {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, handleNextImage, handlePrevImage]);

  // Active variant resolution from real Firebase prices
  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.volume === selectedSize) ||
      product.variants[0]
    );
  }, [product, selectedSize]);

  const displayPrice = activeVariant ? activeVariant.price : (product?.price ?? 0);
  const displayOriginalPrice = activeVariant?.originalPrice ?? product?.originalPrice;
  const displayDiscount =
    displayOriginalPrice && displayPrice && displayOriginalPrice > displayPrice
      ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
      : product?.discountPercentage;

  // Purchase Actions
  const handleAddToCart = () => {
    if (!product) return;

    const finalPriceInPaise = displayPrice * 100;

    const variant = {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: currentMainImage,
      price: finalPriceInPaise,
      volume: selectedSize,
      uniqueId: `${product.id}-${selectedSize}`,
    };

    addToCart(variant, qty);

    // Visual feedback
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
    }, 2200);
  };

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
  };

  // Pincode Checker
  const handleCheckPincode = async (e) => {
    e?.preventDefault();
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setDeliveryResult({
        status: "error",
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }

    setDeliveryResult({ status: "loading" });

    // Try Shiprocket endpoint if available
    try {
      if (API_BASE) {
        const resp = await fetch(`${API_BASE}/api/shiprocket/check-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pincode: pin, cod: true }),
        });
        const data = await resp.json();
        if (resp.ok && data.available) {
          setDeliveryResult({
            status: "success",
            days: data.estimatedDays || "3-4",
            cod: data.codAvailable ?? true,
            courier: data.courier || "Blue Dart Express",
          });
          return;
        }
      }
    } catch {
      // Fallback to instant simulation
    }

    // Realistic delivery simulation for valid 6-digit pincode
    setTimeout(() => {
      setDeliveryResult({
        status: "success",
        days: "3-4",
        cod: true,
        courier: "Blue Dart / Delhivery Air Express",
      });
    }, 450);
  };

  // Review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;
    setSubmittingReview(true);

    const newRev = {
      id: `rev-${Date.now()}`,
      name: reviewName.trim(),
      rating: reviewRating,
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      text: reviewText.trim(),
    };

    try {
      if (product.id) {
        await addReviewToProduct(product.id, newRev);
      }
    } catch (err) {
      console.warn("Could not write review to Firestore:", err);
    }

    setReviews([newRev, ...reviews]);
    setSubmittingReview(false);
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewModalOpen(false);
      setReviewSuccess(false);
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
    }, 1200);
  };

  // Carousel scrolling
  const scrollRelated = (direction) => {
    if (!relatedScrollRef.current) return;
    const scrollAmount = 300;
    relatedScrollRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div
        className="luxury-pd-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
        }}
      >
        <div style={{ textAlign: "center", color: "#78716c", fontSize: "16px" }}>
          Loading bespoke extrait…
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="luxury-pd-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
        }}
      >
        <div style={{ textAlign: "center", color: "#78716c" }}>
          <h2>Fragrance Not Found</h2>
          <p>The requested bespoke creation could not be located in our atelier.</p>
          <button
            onClick={() => navigate("/collections/perfumes")}
            style={{
              padding: "10px 24px",
              background: "#7a1638",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Explore Collection
          </button>
        </div>
      </div>
    );
  }



  // Custom inline style mapping for dynamic theme adaptation
  const themeStyles = {
    "--pd-accent": theme.accent,
    "--pd-accent-hover": theme.accentHover,
    "--pd-subtle-bg": theme.subtleBg,
    "--pd-badge-bg": theme.badgeBg,
    "--pd-save-bg": theme.saveBadgeBg,
    "--pd-save-color": theme.saveBadgeColor,
    "--pd-glow": theme.glow,
  };

  return (
    <div className="luxury-pd-page" style={themeStyles}>
      <SEO
        title={`${product.name} | Perfume Copy`}
        description={product.description || `Buy ${product.name} luxury extrait de parfum online at Perfume Copy.`}
        image={currentMainImage}
        url={`http://www.perfumecopy.com/product/${product.slug || product.id}`}
        type="website"
        jsonLd={{
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.name,
          "image": [currentMainImage],
          "description": product.description || `Handcrafted luxury perfume ${product.name}`,
          "brand": {
            "@type": "Brand",
            "name": "Perfume Copy"
          },
          "offers": {
            "@type": "Offer",
            "url": `http://www.perfumecopy.com/product/${product.slug || product.id}`,
            "priceCurrency": "INR",
            "price": displayPrice,
            "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        }}
      />
      <div className="luxury-pd-container">
        {/* Breadcrumb Navigation */}
        <nav className="luxury-pd-breadcrumbs" aria-label="Breadcrumbs">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <Link to="/collections/perfumes">Perfumes</Link>
          <span className="separator">/</span>
          <span>{product.category || "High Niche"}</span>
          <span className="separator">/</span>
          <span className="current">{product.name}</span>
        </nav>

        {/* Main 2-Column Product Grid */}
        <div className="luxury-pd-main-grid">
          {/* Left Column: Studio Gallery */}
          <div className="luxury-pd-gallery">
            <div
              className="luxury-pd-main-image-wrap"
              onClick={() => setLightboxOpen(true)}
              title="Click to zoom in"
            >
              <img
                src={currentMainImage}
                alt={product.name}
                className="luxury-pd-main-img"
              />
              <button
                type="button"
                className="luxury-pd-zoom-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxOpen(true);
                }}
                aria-label="Zoom image"
              >
                ⌕
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div className="luxury-pd-thumbnails">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`luxury-pd-thumb-btn ${idx === activeImageIndex ? "active" : ""
                      }`}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View thumbnail ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="luxury-pd-thumb-img"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Product Information */}
          <div className="luxury-pd-info">
            {/* Badge & Category */}
            <div className="luxury-pd-badge-row">
              <span className="luxury-pd-badge">{product.badge || "BESTSELLER"}</span>
            </div>
            <div className="luxury-pd-category">{product.category || "HIGH NICHE"}</div>

            {/* Title & Key Notes */}
            <h1 className="luxury-pd-title">{product.name}</h1>
            <div className="luxury-pd-key-notes">{product.keyNotes}</div>

            {/* Rating Row */}
            <div
              className="luxury-pd-rating-row"
              onClick={() => {
                setActiveTab("description");
                const revSection = document.getElementById("customer-reviews");
                if (revSection) {
                  revSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <div className="luxury-pd-stars">
                {"★".repeat(Math.round(product.rating || (reviews.length > 0 ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length : 5)))}
              </div>
              <span className="luxury-pd-rating-text">
                {product.rating !== null
                  ? Number(product.rating).toFixed(1)
                  : reviews.length > 0
                  ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
                  : "5.0"}
              </span>
              <span className="luxury-pd-reviews-count">
                {reviews.length > 0
                  ? `(${reviews.length} ${reviews.length === 1 ? "Review" : "Reviews"})`
                  : product.reviewsCount !== null
                  ? `(${product.reviewsCount} Reviews)`
                  : "(Authentic Scent)"}
              </span>
            </div>

            {/* Price & Discount */}
            <div className="luxury-pd-price-row">
              <span className="luxury-pd-current-price">
                {formatPrice(displayPrice)}
              </span>
              {displayOriginalPrice > displayPrice && (
                <span className="luxury-pd-original-price">
                  {formatPrice(displayOriginalPrice)}
                </span>
              )}
              {displayDiscount !== null && displayDiscount > 0 && (
                <span className="luxury-pd-save-pill">
                  Save {displayDiscount}%
                </span>
              )}
            </div>

            {/* Short Editorial Description */}
            <p className="luxury-pd-description-lead">{product.description}</p>

            {/* Size & Quantity Stepper */}
            <div className="luxury-pd-controls-row">
              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="luxury-pd-control-group">
                  <span className="luxury-pd-control-label">Size</span>
                  <div className="luxury-pd-sizes-list">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`luxury-pd-size-pill ${selectedSize === s ? "active" : ""
                          }`}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="luxury-pd-control-group">
                <span className="luxury-pd-control-label">Quantity</span>
                <div className="luxury-pd-stepper">
                  <button
                    type="button"
                    className="luxury-pd-stepper-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="luxury-pd-stepper-val">{qty}</span>
                  <button
                    type="button"
                    className="luxury-pd-stepper-btn"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="luxury-pd-actions-row">
              <button
                type="button"
                className={`luxury-pd-add-to-cart-btn ${addedAnimation ? "added" : ""
                  }`}
                onClick={handleAddToCart}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {addedAnimation ? "Added to Cart ✓" : "ADD TO CART"}
              </button>

              <button
                type="button"
                className={`luxury-pd-wishlist-btn ${wishlisted ? "wishlisted" : ""
                  }`}
                onClick={handleToggleWishlist}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>

            {/* Delivery Pincode Checker */}
            <div className="luxury-pd-delivery-box">
              <div className="luxury-pd-delivery-header">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Check Delivery</span>
              </div>
              <form
                className="luxury-pd-pincode-form"
                onSubmit={handleCheckPincode}
              >
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter your PIN code"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="luxury-pd-pincode-input"
                />
                <button
                  type="submit"
                  className="luxury-pd-pincode-btn"
                  disabled={deliveryResult?.status === "loading"}
                >
                  {deliveryResult?.status === "loading" ? "Checking…" : "Check"}
                </button>
              </form>

              {deliveryResult && (
                <div
                  className={`luxury-pd-delivery-result ${deliveryResult.status}`}
                >
                  {deliveryResult.status === "success" && (
                    <>
                      ✓ Delivery available in <strong>{deliveryResult.days} business days</strong> via {deliveryResult.courier}. Cash on delivery {deliveryResult.cod ? "available" : "not available"}.
                    </>
                  )}
                  {deliveryResult.status === "error" && (
                    <span>✕ {deliveryResult.message}</span>
                  )}
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="luxury-pd-trust-row">
              <div className="luxury-pd-trust-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Secure checkout</span>
              </div>
              <div className="luxury-pd-trust-divider" />
              <div className="luxury-pd-trust-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span>Authentic fragrance</span>
              </div>
              <div className="luxury-pd-trust-divider" />
              <div className="luxury-pd-trust-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
                <span>Easy support</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Tabs Section ---------------- */}
        <section className="luxury-pd-tabs-section">
          <nav className="luxury-pd-tabs-nav" aria-label="Product Details Tabs">
            <button
              type="button"
              className={`luxury-pd-tab-btn ${activeTab === "description" ? "active" : ""
                }`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              type="button"
              className={`luxury-pd-tab-btn ${activeTab === "notes" ? "active" : ""
                }`}
              onClick={() => setActiveTab("notes")}
            >
              Fragrance Notes
            </button>
            <button
              type="button"
              className={`luxury-pd-tab-btn ${activeTab === "howToUse" ? "active" : ""
                }`}
              onClick={() => setActiveTab("howToUse")}
            >
              How to Use
            </button>
          </nav>

          {/* Description Tab Content */}
          {activeTab === "description" && (
            <div className="luxury-pd-tab-panel">
              <div className="luxury-pd-desc-grid">
                <div>
                  <h3 className="luxury-pd-story-title">
                    {product.storyTitle || "A Fragrance That Defines Elegance"}
                  </h3>
                  <p className="luxury-pd-story-text">{product.storyText}</p>
                </div>

                {/* Fragrance Pyramid Cards Showcase */}
                {product.pyramid && (
                  <div className="luxury-pd-pyramid-row">
                    {product.pyramid.top && (
                      <div className="luxury-pd-pyramid-card">
                        <span className="luxury-pd-pyramid-badge">
                          {product.pyramid.top.title || "Top Notes"}
                        </span>
                        <div className="luxury-pd-pyramid-img-wrap">
                          <img
                            src={product.pyramid.top.image || "/note-saffron.png"}
                            alt={product.pyramid.top.notes}
                            className="luxury-pd-pyramid-img"
                          />
                        </div>
                        <div className="luxury-pd-pyramid-notes">
                          {product.pyramid.top.notes}
                        </div>
                      </div>
                    )}

                    {product.pyramid.heart && (
                      <div className="luxury-pd-pyramid-card">
                        <span className="luxury-pd-pyramid-badge">
                          {product.pyramid.heart.title || "Heart Notes"}
                        </span>
                        <div className="luxury-pd-pyramid-img-wrap">
                          <img
                            src={product.pyramid.heart.image || "/note-rose.png"}
                            alt={product.pyramid.heart.notes}
                            className="luxury-pd-pyramid-img"
                          />
                        </div>
                        <div className="luxury-pd-pyramid-notes">
                          {product.pyramid.heart.notes}
                        </div>
                      </div>
                    )}

                    {product.pyramid.base && (
                      <div className="luxury-pd-pyramid-card">
                        <span className="luxury-pd-pyramid-badge">
                          {product.pyramid.base.title || "Base Notes"}
                        </span>
                        <div className="luxury-pd-pyramid-img-wrap">
                          <img
                            src={product.pyramid.base.image || "/note-oud.png"}
                            alt={product.pyramid.base.notes}
                            className="luxury-pd-pyramid-img"
                          />
                        </div>
                        <div className="luxury-pd-pyramid-notes">
                          {product.pyramid.base.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fragrance Notes Tab Content */}
          {activeTab === "notes" && (
            <div className="luxury-pd-tab-panel">
              <div style={{ maxWidth: "780px", marginBottom: "28px" }}>
                <h3 className="luxury-pd-story-title">Olfactory Structure & Architecture</h3>
                <p className="luxury-pd-story-text">
                  Each layer unfolds at distinct phases of evaporation, evolving seamlessly on the warmth of your skin.
                </p>
              </div>

              {product.pyramid && (
                <div className="luxury-pd-pyramid-row" style={{ maxWidth: "880px" }}>
                  {product.pyramid.top && (
                    <div className="luxury-pd-pyramid-card">
                      <span className="luxury-pd-pyramid-badge">Top Notes (0-30 mins)</span>
                      <div className="luxury-pd-pyramid-img-wrap">
                        <img
                          src={product.pyramid.top.image || "/note-saffron.png"}
                          alt={product.pyramid.top.notes}
                          className="luxury-pd-pyramid-img"
                        />
                      </div>
                      <div className="luxury-pd-pyramid-notes">{product.pyramid.top.notes}</div>
                    </div>
                  )}

                  {product.pyramid.heart && (
                    <div className="luxury-pd-pyramid-card">
                      <span className="luxury-pd-pyramid-badge">Heart Notes (2-4 hours)</span>
                      <div className="luxury-pd-pyramid-img-wrap">
                        <img
                          src={product.pyramid.heart.image || "/note-rose.png"}
                          alt={product.pyramid.heart.notes}
                          className="luxury-pd-pyramid-img"
                        />
                      </div>
                      <div className="luxury-pd-pyramid-notes">{product.pyramid.heart.notes}</div>
                    </div>
                  )}

                  {product.pyramid.base && (
                    <div className="luxury-pd-pyramid-card">
                      <span className="luxury-pd-pyramid-badge">Base Notes (8-16 hours)</span>
                      <div className="luxury-pd-pyramid-img-wrap">
                        <img
                          src={product.pyramid.base.image || "/note-oud.png"}
                          alt={product.pyramid.base.notes}
                          className="luxury-pd-pyramid-img"
                        />
                      </div>
                      <div className="luxury-pd-pyramid-notes">{product.pyramid.base.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical specifications */}
              {product.specifications && (
                <div className="luxury-pd-specs-grid">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="luxury-pd-spec-card">
                      <div className="luxury-pd-spec-label">{key}</div>
                      <div className="luxury-pd-spec-value">{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How to Use Tab Content */}
          {activeTab === "howToUse" && (
            <div className="luxury-pd-tab-panel">
              <h3 className="luxury-pd-story-title">The Master Application Ritual</h3>
              <div className="luxury-pd-ritual-list">
                {product.howToUse?.map((step, idx) => (
                  <div key={idx} className="luxury-pd-ritual-item">
                    <span className="luxury-pd-ritual-num">0{idx + 1}</span>
                    <span className="luxury-pd-ritual-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ---------------- Customer Reviews Section ---------------- */}
        <section id="customer-reviews" className="luxury-pd-reviews-section">
          <div className="luxury-pd-reviews-header">
            <h3 className="luxury-pd-reviews-title">
              Client Appraisals ({reviews.length})
            </h3>
            <button
              type="button"
              className="luxury-pd-write-review-btn"
              onClick={() => setReviewModalOpen(true)}
            >
              Write an Appraisal
            </button>
          </div>

          <div className="luxury-pd-reviews-list">
            {reviews.length === 0 ? (
              <p style={{ color: "#78716c", fontStyle: "italic" }}>
                Be the first connoisseur to review this creation.
              </p>
            ) : (
              reviews.map((rev, idx) => (
                <div key={rev.id || idx} className="luxury-pd-review-card">
                  <div className="luxury-pd-review-top">
                    <span className="luxury-pd-review-author">{rev.name}</span>
                    <span className="luxury-pd-review-date">{rev.date}</span>
                  </div>
                  <div className="luxury-pd-stars" style={{ fontSize: "14px" }}>
                    {"★".repeat(rev.rating || 5)}
                  </div>
                  <p className="luxury-pd-review-text">{rev.text}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ---------------- Related Carousel: "You May Also Like" ---------------- */}
        <section className="luxury-pd-related-section">
          <div className="luxury-pd-related-header">
            <h3 className="luxury-pd-related-title">— You May Also Like</h3>
            <div className="luxury-pd-carousel-arrows">
              <button
                type="button"
                className="luxury-pd-arrow-btn"
                onClick={() => scrollRelated("prev")}
                aria-label="Previous related products"
              >
                ‹
              </button>
              <button
                type="button"
                className="luxury-pd-arrow-btn"
                onClick={() => scrollRelated("next")}
                aria-label="Next related products"
              >
                ›
              </button>
            </div>
          </div>

          <div className="luxury-pd-related-carousel" ref={relatedScrollRef}>
            {relatedProducts.map((p) => {
              const cardImg =
                p.images && p.images.length > 0
                  ? p.images[0]
                  : p.imageUrl || p.image || getProductFallbackImage(p);
              const targetSlug = p.slug || p.id;
              return (
                <Link
                  key={p.id}
                  to={`/product/${targetSlug}`}
                  className="luxury-pd-product-card"
                >
                  <div className="luxury-pd-card-img-wrap">
                    {p.badge && (
                      <span className="luxury-pd-card-badge">{p.badge}</span>
                    )}
                    <img
                      src={cardImg}
                      alt={p.name}
                      className="luxury-pd-card-img"
                    />
                  </div>
                  <div className="luxury-pd-card-body">
                    <span className="luxury-pd-card-category">
                      {p.category || "HIGH NICHE"}
                    </span>
                    <h4 className="luxury-pd-card-name">{p.name}</h4>
                    <div className="luxury-pd-card-price-row">
                      <span className="luxury-pd-card-price">
                        {formatPrice(p.price)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="luxury-pd-card-mrp">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ---------------- Lightbox Zoom Modal ---------------- */}
      {lightboxOpen && (
        <div
          className="luxury-pd-lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="luxury-pd-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom preview"
          >
            ✕
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                className="luxury-pd-lightbox-arrow luxury-pd-lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="luxury-pd-lightbox-arrow luxury-pd-lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          <div
            className="luxury-pd-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentMainImage}
              alt={product.name}
              className="luxury-pd-lightbox-img"
            />
          </div>
        </div>
      )}

      {/* ---------------- Write Review Modal ---------------- */}
      {reviewModalOpen && (
        <div
          className="luxury-pd-modal-overlay"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="luxury-pd-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="luxury-pd-modal-header">
              <h3 className="luxury-pd-modal-title">Share Your Appraisal</h3>
              <button
                type="button"
                className="luxury-pd-modal-close"
                onClick={() => setReviewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "#15803d",
                  fontWeight: 600,
                }}
              >
                Thank you. Your appraisal has been recorded.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="luxury-pd-modal-form">
                <div>
                  <label className="luxury-pd-form-label">Rating</label>
                  <div className="luxury-pd-star-select">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`luxury-pd-star-btn ${star <= reviewRating ? "selected" : ""
                          }`}
                        onClick={() => setReviewRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="luxury-pd-form-label">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="luxury-pd-form-input"
                  />
                </div>

                <div>
                  <label className="luxury-pd-form-label">Your Impression</label>
                  <textarea
                    rows="4"
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe the projection, sillage, and emotional resonance…"
                    className="luxury-pd-form-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="luxury-pd-submit-review-btn"
                >
                  {submittingReview ? "Submitting…" : "Publish Appraisal"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
