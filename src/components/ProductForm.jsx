// src/components/ProductForm.jsx (UPDATED — Original Price/MRP is now per-volume: 50ml & 100ml)
import React, { useEffect, useState } from "react";
import {
  uploadImageFile,
  addProduct,
  updateProduct,
} from "../services/productsService";
import "../styles/productForm.css";

const getPriceForVolume = (product, volume) => {
  const priceObj = product?.prices?.find((p) => p.volume === volume);
  if (priceObj) return (priceObj.price / 100).toFixed(2);
  if (volume === "50ml" && product?.price) return (product.price / 100).toFixed(2);
  return "";
};

// NEW — mirrors getPriceForVolume but reads from the originalPrices array.
// Falls back to the old single `product.originalPrice` field for 50ml so
// existing products saved before this change still show their MRP.
const getOriginalPriceForVolume = (product, volume) => {
  const priceObj = product?.originalPrices?.find((p) => p.volume === volume);
  if (priceObj) return (priceObj.price / 100).toFixed(2);
  if (volume === "50ml" && product?.originalPrice) return (product.originalPrice / 100).toFixed(2);
  return "";
};

export default function ProductForm({ product = null, onSaved = () => {}, onCancel = () => {} }) {
  const volumes = ["50ml", "100ml"];

  const initialPrices = {};
  const initialPurchases = {};
  const initialOriginalPrices = {}; // NEW
  volumes.forEach((v) => {
    initialPrices[v] = getPriceForVolume(product, v);
    const pObj = product?.purchasePrices?.find((p) => p.volume === v);
    initialPurchases[v] = pObj ? (pObj.price / 100).toFixed(2) : "";
    initialOriginalPrices[`original_${v}`] = getOriginalPriceForVolume(product, v); // NEW
  });

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "unisex",
    ...initialPrices,
    ...Object.fromEntries(volumes.map((v) => [`purchase_${v}`, initialPurchases[v]])),
    ...initialOriginalPrices, // NEW — replaces the old single `originalPrice` field
    featured: product?.featured || false,
    tags: (product?.tags || []).join(", "),
    description: product?.description || "",
    notes: (product?.notes || []).join(", "),
  });

  const [images, setImages] = useState(() => {
    if (!product?.images) return [];
    return product.images.map((url) => ({ file: null, previewUrl: url, uploadedUrl: url }));
  });

  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl && img.file) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, { file: null, previewUrl: trimmed, uploadedUrl: trimmed }]);
    setUrlInput("");
  };

  const removeImageAt = (index) => {
    setImages((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.file && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const uploadedUrls = [];
      const totalFiles = images.length || 1;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const uploadedCount = i;

        if (img.uploadedUrl) {
          uploadedUrls.push(img.uploadedUrl);
          continue;
        }
        if (!img.file) continue;

        const { url } = await uploadImageFile(img.file, null, (p) => {
          const singleFilePercent = Math.round(p || 0);
          const overall = Math.round(((uploadedCount + singleFilePercent / 100) / totalFiles) * 100);
          setProgress(overall);
        });

        uploadedUrls.push(url);
      }

      const finalImageUrls = images.map((img) => img.uploadedUrl || uploadedUrls.shift()).filter(Boolean);

      const pricesData = volumes
        .map((v) => ({ volume: v, price: Math.round(parseFloat(formData[v] || 0) * 100) }))
        .filter((p) => p.price > 0);

      const purchasePricesData = volumes
        .map((v) => ({ volume: v, price: Math.round(parseFloat(formData[`purchase_${v}`] || 0) * 100) }))
        .filter((p) => p.price > 0);

      // NEW — per-volume MRP/"was" price array, same shape as pricesData.
      const originalPricesData = volumes
        .map((v) => ({ volume: v, price: Math.round(parseFloat(formData[`original_${v}`] || 0) * 100) }))
        .filter((p) => p.price > 0);

      const mainPrice = pricesData.find((p) => p.volume === "50ml")?.price || 0;

      // NEW — keep the old top-level `originalPrice` field populated with the
      // 50ml MRP for backward compatibility with any storefront code (e.g.
      // ProductDetail.jsx) still reading that single field for the strikethrough price.
      const mainOriginalPrice = originalPricesData.find((p) => p.volume === "50ml")?.price || 0;

      const payload = {
        name: formData.name,
        category: formData.category,
        price: mainPrice,
        originalPrice: mainOriginalPrice, // kept for backward compatibility
        originalPrices: originalPricesData, // NEW — per-volume MRPs
        prices: pricesData,
        purchasePrices: purchasePricesData,
        featured: !!formData.featured,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        description: formData.description,
        notes: formData.notes.split(",").map((n) => n.trim()).filter(Boolean),
        images: finalImageUrls,
      };

      if (product?.id) {
        await updateProduct(product.id, payload);
      } else {
        await addProduct(payload);
      }

      alert("✅ Product saved successfully!");
      setUploading(false);
      setProgress(0);
      onSaved();
    } catch (err) {
      console.error(err);
      alert("❌ Error saving product: " + (err.message || err));
      setUploading(false);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>

      {/* Top bar with title + cancel button */}
      <div className="form-top-bar">
        <h2>{product ? "Edit Product" : "Add Product"}</h2>
        <button type="button" className="btn-close" onClick={onCancel} aria-label="Close">✕</button>
      </div>

      <label>
        Name
        <input required name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" />
      </label>

      {/* Category selector — drives which homepage section (Men/Women) the product appears in */}
      <label>
        Category
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
        </select>
      </label>

      {/* Grouped by volume — Price, Purchase Price, and Original Price/MRP for
          50ml sit together, then the same trio for 100ml. */}
      {volumes.map((v) => (
        <div
          key={"vol_group_" + v}
          className="price-inputs-group volume-group"
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <label style={{ minWidth: 160 }}>
            Price - {v} (₹)
            <input required={v === "50ml"} type="number" step="0.01" name={v} value={formData[v] || ""} onChange={handleChange} placeholder="0.00" />
          </label>

          <label style={{ minWidth: 160 }}>
            Purchase - {v} (₹)
            <input type="number" step="0.01" name={`purchase_${v}`} value={formData[`purchase_${v}`] || ""} onChange={handleChange} placeholder="0.00" />
          </label>

          <label style={{ minWidth: 160 }}>
            Original Price / MRP - {v} (₹)
            <input
              type="number"
              step="0.01"
              name={`original_${v}`}
              value={formData[`original_${v}`] || ""}
              onChange={handleChange}
              placeholder="e.g. 1499.00"
            />
          </label>
        </div>
      ))}

      <label className="checkbox-field">
        <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
        <span>Featured Product</span>
      </label>

      <label>
        Tags (comma separated)
        <input name="tags" value={formData.tags} onChange={handleChange} placeholder="floral, oud, romantic" />
      </label>

      <label>
        Description
        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Short product description" />
      </label>

      <label>
        Notes (comma separated)
        <input name="notes" value={formData.notes} onChange={handleChange} placeholder="Top: Rose, Heart: Oud, Base: Amber" />
      </label>

      {/* Image URL input */}
      <label>
        Add Image URL
        <div className="url-input-row">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
          />
          <button
  type="button"
  className="btn primary add-url-btn"
  onClick={handleAddUrl}
>
  + Add
</button>
        </div>
      </label>

      {images.length > 0 && (
        <div className="images-grid">
          {images.map((img, idx) => (
            <div className="image-tile" key={idx}>
              {img.previewUrl ? (
                <img src={img.previewUrl} alt={`preview-${idx}`} />
              ) : (
                <div className="image-placeholder">No preview</div>
              )}
              <div className="tile-actions">
                <button type="button" className="btn ghost small" onClick={() => removeImageAt(idx)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="bar" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}

     <div className="form-buttons">
  <button
    type="submit"
    className="btn primary save-btn"
    disabled={uploading}
  >
    {uploading ? "Saving..." : "Save Product"}
  </button>

  <button
    type="button"
    className="btn ghost cancel-btn"
    onClick={onCancel}
    disabled={uploading}
  >
    Cancel
  </button>
</div>
    </form>
  );
}
