// src/components/CategoryBanners.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/categoryBanners.css";

/**
 * CategoryBanners
 * Replaces the old product-grid CategorySection ("For Him" / "For Her"
 * homepage preview). This is just two full-bleed image tiles side by side —
 * a big lifestyle/ad-style photo per category, a bottom gradient so the
 * label stays readable, and a centered uppercase label. Clicking a tile
 * navigates straight to that category's full collection page.
 *
 * Usage:
 * <CategoryBanners
 *   her={{ image: "/images/for-her.jpg", label: "For Her", category: "women" }}
 *   him={{ image: "/images/for-him.jpg", label: "For Him", category: "men" }}
 * />
 */
export default function CategoryBanners({
  her = { image: "", label: "For Her", category: "women" },
  him = { image: "", label: "For Him", category: "men" },
}) {
  const navigate = useNavigate();

  return (
    <section className="cb-section" aria-label="Shop by category">
      <div className="cb-grid">
        <CategoryTile {...her} onClick={() => navigate(`/collections/${her.category}`)} />
        <CategoryTile {...him} onClick={() => navigate(`/collections/${him.category}`)} />
      </div>
    </section>
  );
}

function CategoryTile({ image, label, onClick }) {
  return (
    <div
      className="cb-tile"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      aria-label={`Shop ${label}`}
    >
      <span
        className="cb-tile-img"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <span className="cb-tile-fade" aria-hidden="true" />
      <span className="cb-tile-label">{label}</span>
    </div>
  );
}
