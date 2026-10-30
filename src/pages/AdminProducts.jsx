// src/pages/AdminProducts.jsx (MOBILE-FRIENDLY + SEARCH + CATEGORY DISPLAY + CSV IMPORT/EXPORT)
// FIXED VERSION — see comments marked "FIX:" for what changed and why.
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProductsRealtime,
  deleteProduct,
  deleteImageByPath,
  addProduct,
  updateProduct,
} from "../services/productsService";
import ProductForm from "../components/ProductForm";
import "../styles/adminProducts.css";

/* Fields we never want to blindly overwrite/import verbatim.
   `id` is used only for matching an existing doc, never written as a field.
   Firestore timestamp fields get round-tripped through ISO strings on
   export/import so CSV cells don't choke on Timestamp instances. */
function serializeProductForExport(p) {
  const { id, createdAt, updatedAt, ...rest } = p;
  return {
    id,
    ...rest,
    createdAt: createdAt?.toDate ? createdAt.toDate().toISOString() : createdAt || null,
    updatedAt: updatedAt?.toDate ? updatedAt.toDate().toISOString() : updatedAt || null,
  };
}

function deserializeProductForImport(raw) {
  const { id, ...fields } = raw;
  if (fields.createdAt) {
    const d = new Date(fields.createdAt);
    fields.createdAt = Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (fields.updatedAt) {
    const d = new Date(fields.updatedAt);
    fields.updatedAt = Number.isNaN(d.getTime()) ? undefined : d;
  }
  return { id, fields };
}

/* ── CSV helpers ──────────────────────────────────────────────────
   FIX: Previously we guessed the type of every cell on import by
   trying JSON.parse() on it. That silently corrupted plain string
   fields that happen to look like JSON — a SKU/barcode like
   "8901030895", or a text value like "true"/"false"/"null" — turning
   them into numbers/booleans on import.

   New approach: tag the *encoded* type explicitly at export time so
   import never has to guess:
     ~J~<json>   -> arrays / objects            (JSON.parse)
     ~N~<number> -> numbers                      (Number())
     ~B~<bool>   -> booleans                     ("true"/"false")
     ~S~<string> -> a literal string that happens to start with "~"
                    (escape hatch, extremely rare in practice)
     anything else -> plain string, used exactly as-is, no guessing
*/
function csvEscapeCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function cellToRaw(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value) || (typeof value === "object")) {
    return "~J~" + JSON.stringify(value);
  }
  if (typeof value === "number") return "~N~" + String(value);
  if (typeof value === "boolean") return "~B~" + String(value);
  const str = String(value);
  // Escape hatch: a genuine string that happens to start with our
  // marker prefix — tag it so we don't misread it on the way back in.
  if (str.startsWith("~J~") || str.startsWith("~N~") || str.startsWith("~B~") || str.startsWith("~S~")) {
    return "~S~" + str;
  }
  return str;
}

function rawToValue(raw) {
  if (raw === "") return ""; // empty cell -> empty string, NOT undefined (Firestore rejects undefined)
  if (raw.startsWith("~J~")) {
    try {
      return JSON.parse(raw.slice(3));
    } catch {
      return raw.slice(3); // malformed JSON, fall back to the raw text rather than crashing the import
    }
  }
  if (raw.startsWith("~N~")) {
    const n = Number(raw.slice(3));
    return Number.isNaN(n) ? raw.slice(3) : n;
  }
  if (raw.startsWith("~B~")) return raw.slice(3) === "true";
  if (raw.startsWith("~S~")) return raw.slice(3);
  // FIX: no more blind JSON.parse guessing here — untagged cells are
  // always treated as plain strings, exactly as typed/exported.
  return raw;
}

// Strips any undefined values that might still sneak in (e.g. from
// deserializeProductForImport's date parsing), since Firestore throws
// on undefined field values.
function stripUndefined(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

/* FIX (NEW): The category pages (CategoryPage.jsx -> getProductsByCategoryRealtime)
   query Firestore with an EXACT, case-sensitive match:
       where("category", "==", "men")   /   "women"   /   "unisex"
   Any stored value that isn't precisely one of those three lowercase
   strings simply never matches that query — the product still saves fine
   and still shows up in the Admin grid (which just prints the raw string,
   no query involved), but it silently never appears on /collections/men
   or /collections/women. This is exactly what was happening on import:
   a manually-typed sheet very easily ends up with "Men", "MEN", " men"
   (stray space), "Male", "For Him", etc. instead of the app's internal
   "men"/"women"/"unisex" values, and none of those matched.

   This normalizer trims + lowercases + maps common synonyms so those
   variants resolve to the value the query actually expects. */
function normalizeCategoryValue(raw) {
  if (typeof raw !== "string") return raw;
  const v = raw.trim().toLowerCase();
  if (["men", "man", "male", "him", "for him", "boys"].includes(v)) return "men";
  if (["women", "woman", "female", "her", "for her", "girls"].includes(v)) return "women";
  if (["unisex", "uni-sex", "uni sex", "everyone", "all"].includes(v)) return "unisex";
  // Not a recognized alias — still return the trimmed/lowercased value
  // rather than the raw cell, so at least stray whitespace/casing from
  // spreadsheet entry doesn't silently break the category query.
  return v;
}

/* FIX (NEW): Support importing "human-friendly" CSVs that were built
   manually / in a spreadsheet rather than produced by our own Export
   button — e.g. a sheet with separate price_50ml / price_100ml /
   purchase_50ml / purchase_100ml / original_50ml / original_100ml
   columns, a plain comma-separated "tags" cell, a "|"-separated "notes"
   cell, "TRUE"/"FALSE" text for featured, and a blank/comma-separated
   "images" cell.

   Previously these raw columns were written to Firestore verbatim —
   no `price`/`prices`/`purchasePrices`/`originalPrices` array ever got
   created, so the product saved but showed no price, no images, wrong
   tags/notes, no MRP/strike-through price, and `featured` was stored as
   the literal string "TRUE" instead of a boolean. This function detects
   that shape and converts it into the same schema the app actually uses
   (matching what ProductForm saves).

   Rows that already come from our own Export (properly tagged
   ~J~/~N~/~B~ values, "prices"/"purchasePrices"/"originalPrices" columns
   already present) are left untouched — hasRawPriceCols will be false. */
function normalizeImportedRow(obj) {
  const out = { ...obj };

  // FIX: category normalization runs unconditionally for every imported
  // row — regardless of whether it's a "human-friendly" sheet or a CSV
  // re-imported from our own Export button — since a case/whitespace
  // mismatch can slip into either one.
  if ("category" in out) {
    out.category = normalizeCategoryValue(out.category);
  }

  const hasRawPriceCols =
    "price_50ml" in out || "price_100ml" in out || "purchase_50ml" in out || "purchase_100ml" in out;

  if (!hasRawPriceCols) return out;

  // Sheet values are rupees (e.g. 700 = ₹700), Firestore stores paise.
  const rupeesToPaise = (raw) => {
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
  };

  const p50 = rupeesToPaise(out.price_50ml);
  const p100 = rupeesToPaise(out.price_100ml);
  const pp50 = rupeesToPaise(out.purchase_50ml);
  const pp100 = rupeesToPaise(out.purchase_100ml);
  // FIX: original_50ml / original_100ml (MRP columns) were being left as
  // raw "original_50ml"/"original_100ml" fields and written verbatim to
  // Firestore — but ProductsPage.jsx reads `originalPrices` (array) and
  // `originalPrice` (50ml fallback), same shape as `prices`. Without this
  // conversion, the MRP strike-through price never showed up anywhere in
  // the app, even when the sheet had the data.
  const orig50 = rupeesToPaise(out.original_50ml);
  const orig100 = rupeesToPaise(out.original_100ml);

  out.price = p50; // main/base price shown on cards, mirrors ProductForm behaviour
  out.prices = [
    ...(p50 > 0 ? [{ volume: "50ml", price: p50 }] : []),
    ...(p100 > 0 ? [{ volume: "100ml", price: p100 }] : []),
  ];
  out.purchasePrices = [
    ...(pp50 > 0 ? [{ volume: "50ml", price: pp50 }] : []),
    ...(pp100 > 0 ? [{ volume: "100ml", price: pp100 }] : []),
  ];
  out.originalPrices = [
    ...(orig50 > 0 ? [{ volume: "50ml", price: orig50 }] : []),
    ...(orig100 > 0 ? [{ volume: "100ml", price: orig100 }] : []),
  ];
  out.originalPrice = orig50; // kept for backward compatibility, mirrors ProductForm behaviour

  delete out.price_50ml;
  delete out.price_100ml;
  delete out.purchase_50ml;
  delete out.purchase_100ml;
  delete out.original_50ml;
  delete out.original_100ml;

  // "TRUE" / "FALSE" (any case) -> real boolean
  if (typeof out.featured === "string") {
    out.featured = out.featured.trim().toUpperCase() === "TRUE";
  }

  // "fresh, long lasting, versatile" -> ["fresh", "long lasting", "versatile"]
  if (typeof out.tags === "string") {
    out.tags = out.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // "Top: Bergamot, Citrus | Heart: Floral Accord | Base: Musk, Amber"
  // -> ["Top: Bergamot, Citrus", "Heart: Floral Accord", "Base: Musk, Amber"]
  if (typeof out.notes === "string") {
    out.notes = out.notes.split("|").map((n) => n.trim()).filter(Boolean);
  }

  // Blank column -> no images yet. Comma-separated URLs also supported
  // in case a future version of the sheet fills this column in.
  if (typeof out.images === "string") {
    out.images = out.images.trim() ? out.images.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  return out;
}

function productsToCSV(products) {
  // union of all keys across all rows, "id" first
  const keySet = new Set();
  products.forEach((p) => Object.keys(p).forEach((k) => keySet.add(k)));
  keySet.delete("id");
  const columns = ["id", ...Array.from(keySet)];

  const headerRow = columns.map(csvEscapeCell).join(",");
  const dataRows = products.map((p) =>
    columns.map((col) => csvEscapeCell(cellToRaw(p[col]))).join(",")
  );

  // "sep=," forces Excel to use comma as the delimiter regardless of
  // the OS/Excel regional "List Separator" setting (common cause of
  // everything landing in one column on Indian Windows locales).
  return ["sep=,", headerRow, ...dataRows].join("\r\n");
}

// Parses CSV text (RFC4180-ish: quoted fields, "" escaped quotes, commas/newlines inside quotes)
function parseCSV(text) {
  // FIX: strip a leading UTF-8 BOM first (some editors/OSes re-save
  // the file with one). If we don't strip it before the "sep=," check,
  // the sep=, line never matches, it gets read as the header row
  // instead, and every column shifts by one — silently corrupting the
  // whole import.
  const noBom = text.replace(/^\uFEFF/, "");
  // Strip a leading Excel "sep=," directive line if present, so it
  // doesn't get parsed as a data/header row.
  const cleaned = noBom.replace(/^sep=.\r?\n/i, "");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // last field/row (file may not end with newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function csvToProducts(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = rawToValue(cells[idx] ?? "");
    });
    // FIX: normalize "human-friendly" sheets (price_50ml, tags as plain
    // string, etc.) into the real product schema before it ever reaches
    // Firestore. No-ops for CSVs that came from our own Export button.
    // Also always normalizes `category` (see normalizeCategoryValue above).
    return normalizeImportedRow(obj);
  });
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  // ── Import/Export state ──────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0, errors: [] });

  useEffect(() => {
    const unsub = getProductsRealtime((arr) => setProducts(Array.isArray(arr) ? arr : []));
    return () => unsub && typeof unsub === "function" && unsub();
  }, []);

  // simple client-side search (name, description, tags, category)
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const desc = String(p.description || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : String(p.tags || "").toLowerCase();
      const category = String(p.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || tags.includes(q) || category.includes(q);
    });
  }, [products, query]);

  // ── EXPORT: dump current Firestore products (already in state via the
  // realtime listener) to a downloadable CSV file. No extra reads needed. ──
  function handleExport() {
    if (!products.length) {
      alert("There are no products to export yet.");
      return;
    }
    try {
      const exportData = products.map(serializeProductForExport);
      const csv = productsToCSV(exportData);
      // prepend BOM so Excel opens UTF-8 correctly
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `aura-products-export-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed: " + (err.message || err));
    }
  }

  // ── IMPORT: pick a CSV file previously produced by Export (or a
  // manually-built sheet using price_50ml/price_100ml/original_50ml/
  // original_100ml/tags/notes/featured/images columns — see
  // normalizeImportedRow above), then upsert each row into Firestore.
  // Matching an existing product by `id`: updateProduct(). No id, or id
  // not found among current products: addProduct() creates a new doc. ──
  function handleImportClick() {
    if (importing) return;
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    // reset the input so selecting the same file again still fires onChange
    e.target.value = "";
    if (!file) return;

    let parsed;
    try {
      const text = await file.text();
      parsed = csvToProducts(text);
    } catch (err) {
      console.error("Failed to parse import file:", err);
      alert("Couldn't read that file — make sure it's a valid CSV exported from the Export button.");
      return;
    }

    if (parsed.length === 0) {
      alert("That file doesn't contain any products.");
      return;
    }

    const existingIds = new Set(products.map((p) => p.id));
    const updateCount = parsed.filter((p) => p.id && existingIds.has(p.id)).length;
    const addCount = parsed.length - updateCount;

    const confirmed = window.confirm(
      `Import ${parsed.length} product(s)?\n\n` +
        `• ${updateCount} will UPDATE existing products (matched by id)\n` +
        `• ${addCount} will be ADDED as new products\n\n` +
        `This writes directly to Firestore. Continue?`
    );
    if (!confirmed) return;

    setImporting(true);
    setImportProgress({ done: 0, total: parsed.length, errors: [] });

    let done = 0;
    const errors = [];

    for (const raw of parsed) {
      try {
        const { id, fields } = deserializeProductForImport(raw);
        const cleanFields = stripUndefined(fields);
        if (id && existingIds.has(id)) {
          await updateProduct(id, cleanFields);
        } else {
          await addProduct(cleanFields);
        }
      } catch (err) {
        // FIX: log the full row + full error to console immediately as it
        // happens (not just a truncated alert at the end), so with 100+
        // rows you can actually see *which* row and *why* Firestore
        // rejected it (permission-denied, invalid nested entity, etc.)
        console.error("Import row failed:", raw, err);
        errors.push({ name: raw?.name || "(unnamed)", error: err.message || String(err), row: raw });
      } finally {
        done += 1;
        setImportProgress({ done, total: parsed.length, errors });
      }
    }

    setImporting(false);

    if (errors.length) {
      // FIX: dump the FULL error list to console (not just first 5) as a
      // table — with 132 rows you need to actually see all failures to
      // find the pattern, not just a truncated alert.
      console.group(`Import finished with ${errors.length} error(s) out of ${parsed.length}`);
      console.table(errors.map((e) => ({ name: e.name, error: e.error })));
      console.groupEnd();

      alert(
        `Import finished with ${errors.length} error(s) out of ${parsed.length}.\n\n` +
          errors
            .slice(0, 5)
            .map((e) => `• ${e.name}: ${e.error}`)
            .join("\n") +
          (errors.length > 5 ? `\n…and ${errors.length - 5} more.` : "") +
          `\n\nOpen the browser console (F12) for the full list of every failed row and its exact error.`
      );
    } else {
      alert(`Successfully imported ${parsed.length} product(s).`);
    }
  }

  return (
    <main className="admin-products-page">
      <header className="admin-header">
        <button
          type="button"
          className="admin-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>

        <h1>Manage Products</h1>

        <div className="admin-header-actions">
          <input
            aria-label="Search products"
            placeholder="Search by name, description, tags or category..."
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Hidden file input driving the Import button */}
          <input
            type="file"
            accept=".csv,text/csv"
            ref={fileInputRef}
            onChange={handleImportFile}
            style={{ display: "none" }}
          />

          <button
            type="button"
            className="btn ghost"
            onClick={handleExport}
            disabled={importing}
            title="Download all products as a CSV file"
          >
            Export
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={handleImportClick}
            disabled={importing}
            title="Upload a CSV file to add/update products in Firestore"
          >
            {importing ? `Importing ${importProgress.done}/${importProgress.total}…` : "Import"}
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        </div>
      </header>

      {importing && (
        <p className="muted small admin-import-status" role="status">
          Importing products… {importProgress.done} of {importProgress.total} processed
          {importProgress.errors.length > 0 && ` (${importProgress.errors.length} error(s) so far)`}
        </p>
      )}

      <section className="admin-products-grid">
        {filtered.length === 0 && <p className="muted small">No products match your search.</p>}

        {filtered.map((p) => (
          <motion.div key={p.id} className="admin-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="admin-card-media">
              <AdminMedia product={p} />
            </div>

            <div className="admin-card-body">
              <div>
                <h3>{p.name}</h3>
                <p className="muted small">{p.description}</p>
                <div className="muted tiny">
                  Tags: {Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "")}
                </div>
                <div className="muted tiny">
                  Category:{" "}
                  <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                    {p.category || "unisex"}
                  </span>
                </div>

                <div className="admin-prices">
                  {Array.isArray(p.prices) && p.prices.length > 0 ? (
                    <div className="price-grid">
                      {p.prices.map((pr) => (
                        <div key={pr.volume} className="price-item">
                          <div className="vol">{pr.volume}</div>
                          <div className="amt">₹{(pr.price / 100).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="price-item">
                      <div className="vol">50ml</div>
                      <div className="amt">{p.price ? `₹${(p.price / 100).toFixed(2)}` : "N/A"}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card-actions">
                <button
                  className="btn ghost small"
                  onClick={() => {
                    setEditing(p);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn ghost small danger"
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete '${p.name}'?`)) {
                      try {
                        if (p._imagePaths && Array.isArray(p._imagePaths)) {
                          for (const path of p._imagePaths) {
                            try {
                              await deleteImageByPath(path);
                            } catch (e) {
                              /* ignore */
                            }
                          }
                        }
                        await deleteProduct(p.id);
                      } catch (err) {
                        console.error("Failed to delete product", err);
                        alert("Failed to delete product: " + (err.message || err));
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <AnimatePresence>
        {showForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.28 }}>
              <ProductForm
                product={editing}
                onSaved={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AdminMedia({ product }) {
  const imgs = Array.isArray(product?.images) && product.images.length > 0 ? product.images : product?.imageUrl ? [product.imageUrl] : ["/smoke-fallback.jpg"];
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (hover || imgs.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => setActive((a) => (a + 1) % imgs.length), 3000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [imgs.length, hover]);

  return (
    <div className="admin-media" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <motion.img key={`${product.id}-${active}`} src={imgs[active]} alt={product.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45 }} />
      {imgs.length > 1 && (
        <div className="thumb-row small">
          {imgs.slice(0, 5).map((s, idx) => (
            <button key={idx} className={`thumb-btn ${active === idx ? "active" : ""}`} onClick={() => setActive(idx)} style={{ backgroundImage: `url(${s})` }} aria-label={`show ${idx + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
