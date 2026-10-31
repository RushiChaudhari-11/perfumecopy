// src/services/productsService.js (UPDATED — unisex products now auto-merge into Men, Women, AND Featured)
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDoc,
  limit,
  arrayUnion,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

/* COLLECTION REF */
const productsCol = collection(db, "products");

/* Upload a single image file to Firebase Storage and return the public URL + path */
export async function uploadImageFile(file, filePath = null, onProgress = () => {}) {
  if (!file) return null;
  const id = Date.now().toString() + "-" + Math.floor(Math.random() * 10000);
  const path = filePath || `product-images/${id}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const sRef = storageRef(storage, path);
  const uploadTask = uploadBytesResumable(sRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        try {
          onProgress(Math.round(progress));
        } catch (e) {
          // ignore onProgress errors
        }
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

/* Upload multiple image files in parallel with aggregated progress callback
   files: array of File
   onProgress: (overallPercent:number) => void
   Returns: [{url, path}, ...]
*/
export async function uploadMultipleImages(files = [], onProgress = () => {}) {
  if (!Array.isArray(files) || files.length === 0) return [];

  const progresses = new Array(files.length).fill(0);

  const updateOverall = () => {
    const sum = progresses.reduce((s, p) => s + p, 0);
    const overall = Math.round(sum / progresses.length);
    try {
      onProgress(overall);
    } catch (e) {
      // ignore
    }
  };

  const uploadPromises = files.map((file, idx) =>
    uploadImageFile(file, null, (p) => {
      progresses[idx] = p || 0;
      updateOverall();
    })
  );

  const results = await Promise.all(uploadPromises);
  try {
    onProgress(100);
  } catch (e) {}
  return results;
}

/* Delete a file from Firebase Storage by its storage path */
export async function deleteImageByPath(path) {
  if (!path) return false;
  try {
    const dRef = storageRef(storage, path);
    await deleteObject(dRef);
    return true;
  } catch (err) {
    console.warn("Failed to delete image at path:", path, err?.code || err?.message || err);
    return false;
  }
}

/* Add product (object fields). Accepts images: [url,...], prices: [{volume,price}],
   purchasePrices: [{volume,price}], category: "men" | "women" | "unisex" */
export async function addProduct(product) {
  const payload = {
    ...product,
    createdAt: new Date(),
  };

  const docRef = await addDoc(productsCol, payload);
  return { id: docRef.id, ...payload };
}

/* Update product by id. Prefer passing only fields to update. This will set updatedAt automatically. */
export async function updateProduct(id, updates) {
  if (!id) throw new Error("Missing product id");
  const d = doc(db, "products", id);
  await updateDoc(d, { ...updates, updatedAt: new Date() });
  return true;
}

/* Delete product document by id (does NOT automatically delete storage images) */
export async function deleteProduct(id) {
  const d = doc(db, "products", id);
  await deleteDoc(d);
  return true;
}

/* Get products once (no realtime) with optional limit & tag */
export async function getProductsOnce({ tag = null, limitNum = 100 } = {}) {
  let q = query(productsCol, orderBy("createdAt", "desc"));
  if (tag) q = query(productsCol, where("tags", "array-contains", tag), orderBy("createdAt", "desc"));
  if (limitNum) q = query(q, limit(limitNum));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Shared in-memory & persistent cache for lightning-fast mobile loading
let memoryProductsCache = null;
const PRODUCTS_CACHE_KEY = "perfumecopy_products_cache_v2";

try {
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProductsCache = parsed;
      }
    }
  }
} catch (e) {
  // localStorage disabled or private browsing
}

/* Real-time listener returns unsubscribe function */
export function getProductsRealtime(callback, { tag = null, onError = null } = {}) {
  // 1. Instantly return cached products on mobile / slow connections (0ms initial render)
  if (!tag && memoryProductsCache && Array.isArray(memoryProductsCache) && memoryProductsCache.length > 0) {
    try {
      callback(memoryProductsCache);
    } catch (e) {
      console.warn("[getProductsRealtime] Cache emit warning:", e);
    }
  }

  let q = query(productsCol, orderBy("createdAt", "desc"));
  if (tag) q = query(productsCol, where("tags", "array-contains", tag), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!tag && arr.length > 0) {
        memoryProductsCache = arr;
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(arr));
          }
        } catch (e) {}
      }
      callback(arr);
    },
    (err) => {
      console.error("[getProductsRealtime] Firestore error:", err);
      if (!tag && memoryProductsCache && memoryProductsCache.length > 0) {
        callback(memoryProductsCache);
      }
      if (typeof onError === "function") onError(err);
    }
  );
  return unsub;
}

/* ---------- Helpers for merging two live query results ----------
   Used because Firestore's onSnapshot doesn't support OR across different
   field values in one query without the newer or() operator + extra indexes.
   Simpler & safer to run two listeners and merge client-side.
*/
function dedupeById(arrA = [], arrB = []) {
  const map = new Map();
  arrA.forEach((item) => map.set(item.id, item));
  arrB.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function toMillis(val) {
  if (!val) return 0;
  if (typeof val.toMillis === "function") return val.toMillis(); // Firestore Timestamp
  const t = new Date(val).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortByCreatedAtDesc(arr) {
  return [...arr].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/* ---------- Real-time listener for featured products ----------
   NOW ALSO includes any product with category === "unisex", even if its
   `featured` flag is false — so unisex products automatically show up in
   the Featured Collection section on the homepage without needing the
   "Featured Product" checkbox ticked manually.
*/
export function getFeaturedProductsRealtime(callback, { onError = null } = {}) {
  // Instantly emit from cache for mobile 0ms render
  if (memoryProductsCache && Array.isArray(memoryProductsCache) && memoryProductsCache.length > 0) {
    const cachedFeatured = memoryProductsCache.filter((p) => p.featured === true || p.category === "unisex");
    if (cachedFeatured.length > 0) {
      try {
        callback(cachedFeatured);
      } catch (e) {}
    }
  }

  let featuredResults = [];
  let unisexResults = [];
  let gotFeatured = false;
  let gotUnisex = false;

  const emit = () => {
    if (!gotFeatured || !gotUnisex) return; // wait until both listeners have fired at least once
    const merged = sortByCreatedAtDesc(dedupeById(featuredResults, unisexResults));
    callback(merged);
  };

  const qFeatured = query(productsCol, where("featured", "==", true), orderBy("createdAt", "desc"));
  const unsubFeatured = onSnapshot(
    qFeatured,
    (snapshot) => {
      featuredResults = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      gotFeatured = true;
      emit();
    },
    (err) => {
      console.error("[getFeaturedProductsRealtime:featured] Firestore error:", err);
      if (typeof onError === "function") onError(err);
    }
  );

  const qUnisex = query(productsCol, where("category", "==", "unisex"), orderBy("createdAt", "desc"));
  const unsubUnisex = onSnapshot(
    qUnisex,
    (snapshot) => {
      unisexResults = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      gotUnisex = true;
      emit();
    },
    (err) => {
      console.error("[getFeaturedProductsRealtime:unisex] Firestore error:", err);
      if (typeof onError === "function") onError(err);
    }
  );

  return () => {
    unsubFeatured();
    unsubUnisex();
  };
}

/* ---------- Real-time listener for products filtered by category ----------
   Supports: "all", "perfumes", "men", "women", "unisex", "deodorants", "gift-sets", etc.
*/
export function getProductsByCategoryRealtime(category, callback, { limitNum = null, onError = null } = {}) {
  const catLower = typeof category === "string" ? category.toLowerCase().trim() : "all";

  return getProductsRealtime(
    (list) => {
      if (!Array.isArray(list)) {
        callback([]);
        return;
      }

      // If "all" or "perfumes", all 130 products are fine fragrances
      if (catLower === "all" || catLower === "perfumes" || catLower === "shop") {
        const res = limitNum ? list.slice(0, limitNum) : list;
        callback(res);
        return;
      }

      // If "men"
      if (catLower === "men") {
        const filtered = list.filter((p) => {
          const c = String(p.category || "").toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];
          return (
            c === "men" ||
            c === "unisex" ||
            tags.includes("men") ||
            tags.includes("masculine") ||
            tags.includes("woody")
          );
        });
        callback(limitNum ? filtered.slice(0, limitNum) : filtered);
        return;
      }

      // If "women"
      if (catLower === "women") {
        const filtered = list.filter((p) => {
          const c = String(p.category || "").toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];
          return (
            c === "women" ||
            c === "unisex" ||
            tags.includes("women") ||
            tags.includes("feminine") ||
            tags.includes("floral")
          );
        });
        callback(limitNum ? filtered.slice(0, limitNum) : filtered);
        return;
      }

      // Specific collection types (deodorants, gift-sets, air-fresheners, body-talc, nano)
      const tagMap = {
        deodorants: "deodorant",
        "body-talc": "talc",
        "air-fresheners": "fresh",
        "gift-sets": "gift",
        "nano-freshners": "fresh",
        nano: "fresh",
      };
      const searchTag = tagMap[catLower] || catLower;
      const filtered = list.filter((p) => {
        const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).toLowerCase()) : [];
        const name = String(p.name || "").toLowerCase();
        const desc = String(p.description || "").toLowerCase();
        return (
          tags.some((t) => t.includes(searchTag)) ||
          name.includes(searchTag) ||
          desc.includes(searchTag)
        );
      });

      // If matching products found, return them; otherwise return full catalog so view is never empty
      const finalItems = filtered.length > 0 ? filtered : list;
      callback(limitNum ? finalItems.slice(0, limitNum) : finalItems);
    },
    { onError }
  );
}

/* get single product by id with slug fallback */
export async function getProductById(id) {
  if (!id) return null;
  try {
    const d = doc(db, "products", id);
    const snap = await getDoc(d);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn("Direct getDoc failed for:", id, err?.message);
  }

  // Fallback: check by slug field
  try {
    const qSlug = query(productsCol, where("slug", "==", id), limit(1));
    const snapSlug = await getDocs(qSlug);
    if (!snapSlug.empty) {
      const docFound = snapSlug.docs[0];
      return { id: docFound.id, ...docFound.data() };
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/* ---------- Add a review to a product's reviews array ----------
   Uses arrayUnion so concurrent submissions from different users
   don't overwrite each other — each review is appended safely.
   review: { id, name, rating, text, createdAt }
*/
export async function addReviewToProduct(productId, review) {
  if (!productId) throw new Error("Missing product id");
  if (!review || !review.name || !review.text || !review.rating) {
    throw new Error("Review must include name, rating, and text");
  }
  const d = doc(db, "products", productId);
  await updateDoc(d, {
    reviews: arrayUnion(review),
    updatedAt: new Date(),
  });
  return true;
}

/* Utility: format price (supports both paise and direct rupee integers) */
export function formatPrice(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  // All Firestore product prices are in paise (e.g. 56000 paise = ₹560, 150000 paise = ₹1,500)
  const rupees = n >= 10000 ? Math.round(n / 100) : n;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/* Curated gallery of distinct 4K luxury perfume bottles */
export const LUXURY_BOTTLE_PREVIEWS = [
  "/occasion-aura-alp-4k.jpg",
  "/occasion-aura-metal-4k.jpg",
  "/occasion-aura-ozone-4k.jpg",
  "/bottle-auric-gold.jpg",
  "/bottle-velvet-noir.png",
  "/bottle-clean-amethyst.jpg",
  "/bottle-clean-fleur.jpg",
  "/bottle-clean-twist.jpg",
  "/occasion-amour-rose-4k.jpg",
  "/bottle-citrus-bloom.png",
  "/bottle-cozy-amber.png",
  "/bottle-clean-ruby.jpg",
];

/* Luxury presentation bottle selector for products without uploaded image */
export function getProductFallbackImage(p) {
  if (!p) return LUXURY_BOTTLE_PREVIEWS[0];

  const nameText = `${p?.name || ""} ${p?.inspiredBy || ""}`.toLowerCase();
  const tagsText = (Array.isArray(p?.tags) ? p.tags.join(" ") : String(p?.tags || "")).toLowerCase();

  // 1. Direct name/brand signature associations (matched on perfume name/inspiration, never generic notes)
  if (nameText.includes("sauvage") || nameText.includes("noir") || nameText.includes("metal") || nameText.includes("black") || nameText.includes("tobacco") || nameText.includes("dark")) {
    return "/occasion-aura-metal-4k.jpg";
  }
  if (nameText.includes("khamrah") || nameText.includes("fire") || nameText.includes("amber") || nameText.includes("cognac") || nameText.includes("vanille") || nameText.includes("alp")) {
    return "/occasion-aura-alp-4k.jpg";
  }
  if (nameText.includes("ozone") || nameText.includes("aqua") || nameText.includes("ocean") || nameText.includes("blue") || nameText.includes("cool") || nameText.includes("marine")) {
    return "/occasion-aura-ozone-4k.jpg";
  }
  if (nameText.includes("kesar") || nameText.includes("chandan") || nameText.includes("oud") || nameText.includes("gold") || nameText.includes("saffron") || nameText.includes("sandalwood")) {
    return "/bottle-auric-gold.jpg";
  }
  if (nameText.includes("rose") || nameText.includes("amour") || nameText.includes("pink") || nameText.includes("chloe") || nameText.includes("ruby") || nameText.includes("scarlet") || nameText.includes("petal")) {
    return "/occasion-amour-rose-4k.jpg";
  }
  if (nameText.includes("amethyst") || nameText.includes("purple") || nameText.includes("royal") || nameText.includes("velvet") || nameText.includes("violet")) {
    return "/bottle-clean-amethyst.jpg";
  }
  if (nameText.includes("fleur") || nameText.includes("white") || nameText.includes("diamond") || nameText.includes("crystal") || nameText.includes("jasmin")) {
    return "/bottle-clean-fleur.jpg";
  }
  if (nameText.includes("citrus") || nameText.includes("bloom") || nameText.includes("orange") || nameText.includes("neroli") || nameText.includes("lemon")) {
    return "/bottle-citrus-bloom.png";
  }

  // 2. Tag-based fallback if tags specifically indicate a distinctive family
  if (tagsText.includes("oud") || tagsText.includes("sandalwood")) return "/bottle-auric-gold.jpg";
  if (tagsText.includes("leather") || tagsText.includes("smoky") || tagsText.includes("spicy")) return "/occasion-aura-metal-4k.jpg";
  if (tagsText.includes("aquatic") || tagsText.includes("marine")) return "/occasion-aura-ozone-4k.jpg";

  // 3. Deterministic hash distribution based on product ID / name so every perfume gets a distinct bottle
  const key = String(p.id || p.name || "signature");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % LUXURY_BOTTLE_PREVIEWS.length;
  return LUXURY_BOTTLE_PREVIEWS[index];
}

/* Standardized product data normalizer for all components across the app */
export function normalizeFirebaseProduct(p, id = null) {
  if (!p) return null;
  const docId = id || p.id || "";

  // Real price in rupees: all DB prices are in paise (e.g. 56000 => ₹560, 150000 => ₹1,500)
  const rawPrice =
    typeof p.price === "number"
      ? p.price
      : Array.isArray(p.prices) && p.prices.length > 0 && typeof p.prices[0].price === "number"
      ? p.prices[0].price
      : 0;
  const price = rawPrice >= 10000 ? Math.round(rawPrice / 100) : rawPrice;

  // Real original price
  const rawOriginalPrice =
    typeof p.originalPrice === "number"
      ? p.originalPrice
      : Array.isArray(p.originalPrices) && p.originalPrices.length > 0 && typeof p.originalPrices[0].price === "number"
      ? p.originalPrices[0].price
      : null;
  const originalPrice =
    rawOriginalPrice && rawOriginalPrice >= 10000
      ? Math.round(rawOriginalPrice / 100)
      : rawOriginalPrice;

  // Real discount percentage: calculated ONLY when both prices are valid and originalPrice > price
  const discountPercentage =
    originalPrice && price && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  // Real images from Firebase: supports images array or imageUrl
  let images = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    images = p.images.filter((img) => typeof img === "string" && img.trim().length > 0);
  } else if (p.imageUrl && typeof p.imageUrl === "string") {
    images = [p.imageUrl];
  } else if (p.image && typeof p.image === "string") {
    images = [p.image];
  }

  // Graceful visual presentation for products without an uploaded image
  const primaryImage = images.length > 0 ? images[0] : getProductFallbackImage(p);

  // Normalize prices array for volume variants (ensuring 50ml & 100ml choices for all perfumes)
  let variants = [];
  if (Array.isArray(p.prices) && p.prices.length > 0) {
    variants = p.prices.map((pr, idx) => {
      const vPrice = pr.price >= 10000 ? Math.round(pr.price / 100) : pr.price;
      const matchingOrig = Array.isArray(p.originalPrices)
        ? p.originalPrices.find((op) => op.volume === pr.volume)
        : null;
      const vOrigPrice = matchingOrig?.price
        ? matchingOrig.price >= 10000
          ? Math.round(matchingOrig.price / 100)
          : matchingOrig.price
        : null;
      return {
        volume: pr.volume || `${50 * (idx + 1)}ml`,
        price: vPrice,
        originalPrice: vOrigPrice,
      };
    });
  }

  if (variants.length === 1 && (variants[0].volume === "50ml" || variants[0].volume === "50 ml")) {
    const v50 = variants[0];
    const v100Price = Math.round(v50.price * 1.8);
    const v100Orig = v50.originalPrice ? Math.round(v50.originalPrice * 1.8) : null;
    variants.push({
      volume: "100ml",
      price: v100Price,
      originalPrice: v100Orig,
    });
  } else if (variants.length === 0) {
    variants = [
      { volume: "50ml", price, originalPrice },
      { volume: "100ml", price: Math.round(price * 1.8), originalPrice: originalPrice ? Math.round(originalPrice * 1.8) : null },
    ];
  }

  // Notes: if array of strings, join with " · "
  let notesStr = "";
  if (Array.isArray(p.notes)) {
    notesStr = p.notes.join(" · ");
  } else if (typeof p.notes === "string") {
    notesStr = p.notes;
  }

  // Brand / Inspiration
  const brand = p.inspiredBy ? p.inspiredBy : "Signature Atelier";

  // Category
  const category = (p.category || "UNISEX").toUpperCase();
  const tags = Array.isArray(p.tags) ? p.tags : [];

  // Badge: only use actual Firebase values
  let badge = null;
  if (p.featured) {
    badge = "BESTSELLER";
  } else if (tags.includes("bestseller") || tags.includes("hot")) {
    badge = "BESTSELLER";
  } else if (tags.includes("new") || p.isNew) {
    badge = "NEW";
  } else if (tags.includes("limited")) {
    badge = "LIMITED";
  }

  // Fragrance Pyramid parsing for Product Detail
  let pyramid = null;
  const rawNotesList = Array.isArray(p.notes)
    ? p.notes
    : typeof p.notes === "string"
    ? p.notes.split(/[·,]+/)
    : [];
  if (rawNotesList.length > 0) {
    const topNote = rawNotesList.find((n) => /top/i.test(n)) || rawNotesList[0] || "Fresh Accords";
    const heartNote = rawNotesList.find((n) => /heart|middle/i.test(n)) || rawNotesList[1] || "Artisanal Florals";
    const baseNote = rawNotesList.find((n) => /base/i.test(n)) || rawNotesList[2] || "Precious Woods";
    pyramid = {
      top: {
        title: "Top Notes",
        notes: topNote.replace(/^top\s*:\s*/i, "").trim(),
        image: "/note-saffron.png",
      },
      heart: {
        title: "Heart Notes",
        notes: heartNote.replace(/^heart\s*:\s*/i, "").trim(),
        image: "/note-rose.png",
      },
      base: {
        title: "Base Notes",
        notes: baseNote.replace(/^base\s*:\s*/i, "").trim(),
        image: "/note-oud.png",
      },
    };
  }

  return {
    id: docId,
    slug: p.slug || docId,
    name: p.name || "Signature Perfume",
    category,
    brand,
    inspiredBy: p.inspiredBy || null,
    description: p.description || "",
    storyTitle: p.inspiredBy ? `Inspired by ${p.inspiredBy}` : "The Olfactory Composition",
    storyText: p.description || "A masterfully blended eau de parfum crafted with rare olfactory essences for exceptional sillage and longevity.",
    keyNotes: notesStr || (tags.length > 0 ? tags.slice(0, 3).join(" · ") : "Artisanal Extrait de Parfum"),
    notes: notesStr,
    pyramid,
    rawNotes: p.notes || [],
    tags,
    featured: !!p.featured,
    badge,
    price,
    originalPrice,
    discountPercentage,
    images: images.length > 0 ? images : [primaryImage],
    image: primaryImage,
    imageUrl: primaryImage,
    variants,
    sizes: variants.map((v) => v.volume),
    inStock: p.stock !== 0,
    stock: typeof p.stock === "number" ? p.stock : null,
    rating: typeof p.rating === "number" ? p.rating : null,
    reviewsCount: Array.isArray(p.reviews)
      ? p.reviews.length
      : typeof p.reviewsCount === "number"
      ? p.reviewsCount
      : null,
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}