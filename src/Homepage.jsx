// src/Homepage.jsx
import React from "react";
import "./styles.css";
import SEO from "./components/SEO";
import Hero7 from "./components/Hero7";
import TrendingSeason from "./components/TrendingSeason";
import OurCollection from "./components/OurCollection";
import AnnouncementTicker from "./components/AnnouncementTicker";
import ShopByOccasion from "./components/ShopByOccasion";
import WhySignature from "./components/WhySignature";

export default function Homepage({ products = [], onAddToCart = () => {} }) {
  function scrollToFeatured() {
    const el = document.querySelector("#featured-collections");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="homepage">
      <SEO
        title="Perfume Copy | Luxury Handcrafted Fragrances & Artisanal Extraits"
        description="Explore Perfume Copy — bespoke luxury extrait de parfums and fine artisanal fragrances crafted from rare essences."
        url="http://www.perfumecopy.com/"
        image="http://www.perfumecopy.com/logo.png"
      />
      {/* React Bits Pro Hero 7 Section with 3D Curved Perfume Carousel & Center Laser Beam */}
      <Hero7 onCtaClick={scrollToFeatured} />

      {/* Trending this Season - Luxury Product Carousel with Smooth GSAP Scrollbar */}
      <TrendingSeason onAddToCart={onAddToCart} />

      {/* "Collections" in the header scrolls here */}
      <OurCollection />

      {/* Infinite Automatic Continuous Scrolling Offer Ticker Bar */}
      <AnnouncementTicker />

      {/* Shop by Occasion Section with Category Filters & 4K Products */}
      <ShopByOccasion onAddToCart={onAddToCart} />

      {/* Why Signature - Brand Quality & Craftsmanship Pillars */}
      <WhySignature />
    </div>
  );
}
