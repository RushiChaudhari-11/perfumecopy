// importProducts.js
// Reads Aura_Products_Import.xlsx and writes each row into Firestore's "products" collection.
//
// SETUP (one-time):
// 1. npm install firebase-admin xlsx
// 2. Get a service account key:
//    Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
//    Save it in this same folder as serviceAccountKey.json
// 3. Put Aura_Products_Import.xlsx in this same folder (or update XLSX_PATH below)
//
// RUN:
//    node importProducts.js
//
// This is safe to re-run — it uses each product's final "name" (base name + "Inspired by ..."
// if applicable) to check if it already exists, and updates it instead of creating a duplicate.
// Delete that check if you want plain inserts every time.

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const xlsx = require("xlsx");
const path = require("path");

const XLSX_PATH = path.join(__dirname, "Aura_Products_Import.xlsx");
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccountKey.json");

initializeApp({
  credential: cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = getFirestore();

function toPaise(rupees) {
  return Math.round(Number(rupees || 0) * 100);
}

function parseTags(tagsStr) {
  return String(tagsStr || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseNotes(notesStr) {
  // stored in the sheet as "Top: ... | Heart: ... | Base: ..."
  return String(notesStr || "")
    .split("|")
    .map((n) => n.trim())
    .filter(Boolean);
}

function parseImages(imagesStr) {
  return String(imagesStr || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

function parseFeatured(val) {
  if (typeof val === "boolean") return val;
  const s = String(val || "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

// NEW: builds the final display name, appending "Inspired by X" when the
// sheet's inspiredBy value is meaningful (i.e. not blank and not the
// "Generic — no designer reference" placeholder).
function buildDisplayName(baseName, inspiredByRaw) {
  const inspiredBy = String(inspiredByRaw || "").trim();
  const isGeneric = !inspiredBy || /generic/i.test(inspiredBy);
  if (isGeneric) return baseName;
  return `${baseName} (Inspired by ${inspiredBy})`;
}

async function run() {
  const workbook = xlsx.readFile(XLSX_PATH);
  const sheet = workbook.Sheets["Products"] || workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Found ${rows.length} rows in the sheet.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const baseName = String(row.name || "").trim();
    if (!baseName) {
      skipped++;
      continue;
    }

    const inspiredBy = String(row.inspiredBy || "").trim();
    const displayName = buildDisplayName(baseName, inspiredBy);

    const price50 = toPaise(row.price_50ml);
    const price100 = toPaise(row.price_100ml);
    const purchase50 = toPaise(row.purchase_50ml);
    const purchase100 = toPaise(row.purchase_100ml);

    const payload = {
      name: displayName, // <-- now includes "Inspired by X" when applicable
      baseName, // kept separately in case you need the plain product name elsewhere
      inspiredBy,
      category: String(row.category || "unisex").trim().toLowerCase(),
      price: price50, // backward-compat field, matches ProductForm.jsx
      prices: [
        { volume: "50ml", price: price50 },
        { volume: "100ml", price: price100 },
      ],
      purchasePrices: [
        { volume: "50ml", price: purchase50 },
        { volume: "100ml", price: purchase100 },
      ],
      featured: parseFeatured(row.featured),
      tags: parseTags(row.tags),
      description: String(row.description || "").trim(),
      notes: parseNotes(row.notes),
      images: parseImages(row.images),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // avoid duplicates: check if a product with this exact (final) name already exists
    const existing = await db.collection("products").where("name", "==", displayName).limit(1).get();

    if (existing.empty) {
      payload.createdAt = FieldValue.serverTimestamp();
      await db.collection("products").add(payload);
      created++;
    } else {
      await existing.docs[0].ref.update(payload);
      updated++;
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped (no name): ${skipped}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});