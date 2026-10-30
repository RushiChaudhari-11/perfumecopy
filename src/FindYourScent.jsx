// src/FindYourScent.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./findYourScent.css";
import { useNavigate, useLocation } from "react-router-dom";
// switched to live data + helper from services
import { getProductsRealtime, formatPrice, normalizeFirebaseProduct } from "./services/productsService";
import SEO from "./components/SEO";

import ScentEmitter from "./ScentEmitter";

/* MOODS list (art, colors etc.) */
const MOODS = [
  {
    id: "romantic",
    title: "Romantic",
    desc: "Soft florals, warm vanilla, tender musk.",
    tags: ["floral", "vanilla", "amber"],
    color: ["rgba(246,192,232,.95)", "rgba(200,110,220,.9)"],
    art: "romantic1.png",
  },
  {
    id: "fresh",
    title: "Fresh",
    desc: "Citrus lift, green accords, clean musk.",
    tags: ["citrus", "fresh", "green"],
    color: ["rgba(191,233,255,.95)", "rgba(104,195,255,.9)"],
    art: "/fresh.png",
  },
  {
    id: "mysterious",
    title: "Mysterious",
    desc: "Smoky woods, deep oud, dark amber.",
    tags: ["oriental", "woody", "smoky"],
    color: ["rgba(198,176,255,.9)", "rgba(111,66,193,.85)"],
    art: "/mysterious.png",
  },
  {
    id: "bright",
    title: "Bright",
    desc: "Sparkling top notes, playful lively energy.",
    tags: ["citrus", "fresh"],
    color: ["rgba(255,240,184,.95)", "rgba(255,184,77,.9)"],
    art: "/bright.png",
  },
  {
    id: "comfort",
    title: "Comforting",
    desc: "Warm spice, vanilla, gentle amber embrace.",
    tags: ["amber", "spicy", "vanilla"],
    color: ["rgba(255,214,192,.95)", "rgba(217,142,106,.9)"],
    art: "/comfort.png",
  },
];

export default function FindYourScent({ onAddToCart: onAddToCartProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone = location.pathname.includes("/find-your-scent");



  // live products from Firestore
  const [all, setAll] = useState([]);
  useEffect(() => {
    const unsub = getProductsRealtime((data) => {
      setAll(Array.isArray(data) ? data.map((p) => normalizeFirebaseProduct(p, p.id)) : []);
    });
    return () => unsub && typeof unsub === "function" && unsub();
  }, []);

  const [activeMood, setActiveMood] = useState(null);
  const [showAllForMood, setShowAllForMood] = useState(false);

  const [hoveredBottleId, setHoveredBottleId] = useState(null);
  const hoveredRef = useRef(null);

  const orbRefs = useRef({});

  const filtered = useMemo(() => {
    if (!activeMood) return [];
    const mood = MOODS.find((m) => m.id === activeMood);
    if (!mood) return [];
    return all.filter((p) => (p.tags || []).some((t) => mood.tags.includes(t)));
  }, [activeMood, all]);

  return (
    <section id="find-your-scent" className="find-scent-section" aria-labelledby="find-scent-title">
      {isStandalone && (
        <SEO
          title="Find Your Scent - Fragrance Matcher | Perfume Copy"
          description="Take our bespoke fragrance finder quiz to discover your ideal artisanal luxury perfume accords."
          url="http://www.perfumecopy.com/find-your-scent"
        />
      )}
      <div className="decor-images" aria-hidden="true">
        <img className="decor decor-1" src="/decor-petal-1.png" alt="" />
        <img className="decor decor-2" src="/decor-petal-2.png" alt="" />
      </div>

      <div className="container">
        <motion.div className="fy-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {isStandalone ? (
            <h1 id="find-scent-title" className="section-title">Find Your Scent</h1>
          ) : (
            <h2 id="find-scent-title" className="section-title">Find Your Scent</h2>
          )}
          <p className="section-sub">Choose a mood — we’ll show scents that match it.</p>
        </motion.div>

        <motion.div className="mood-row" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}>
          {MOODS.map((m) => {
            const isActive = activeMood === m.id;
            if (!orbRefs.current[m.id]) orbRefs.current[m.id] = React.createRef();
            return (
              <motion.button
                key={m.id}
                ref={orbRefs.current[m.id]}
                className={`mood-orb mood-orb-${m.id} ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (isActive) {
                    setActiveMood(null);
                    setShowAllForMood(false);
                  } else {
                    setActiveMood(m.id);
                    setShowAllForMood(false);
                    setTimeout(() => {
                      const el = document.querySelector("#find-your-scent .mood-results");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 220);
                  }
                }}
                aria-pressed={isActive}
                style={{ "--g1": m.color[0], "--g2": m.color[1] }}
              >
                <div className="orb-art-wrap" aria-hidden={!m.art}>
                  <motion.img src={m.art} alt="" className="orb-art" initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8 }} />
                </div>

                <span className="mood-particles" aria-hidden="true">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className={`particle p${i + 1}`} />
                  ))}
                </span>

                <div className="orb-text">
                  <div className="orb-title">{m.title}</div>
                </div>

                <span className="orb-ring" aria-hidden="true" />
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mood-results" role="region" aria-live="polite">
          {!activeMood ? (
            <motion.div className="mood-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
              <p className="muted">Select a mood to discover matching perfumes.</p>
            </motion.div>
          ) : (
            <>
              <motion.div className="results-head" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <h3>Showing scents for <span className="tag">{MOODS.find(m => m.id === activeMood)?.title}</span></h3>
                <div className="results-actions">
                  <button className="btn ghost" onClick={() => { setActiveMood(null); setShowAllForMood(false); }}>Clear</button>
                  <button className="btn primary" onClick={() => { setShowAllForMood(true); const el = document.querySelector("#find-your-scent .mood-results .grid"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                   Show all ({filtered.length}) →
                  </button>
                </div>
              </motion.div>

              <motion.div className="grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                {(showAllForMood ? filtered : filtered.slice(0, 4)).map((p, i) => (
                  <motion.article
                    key={p.id}
                    className="product-card-mini"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    whileHover={{ translateY: -6 }}
                    onMouseEnter={() => { setHoveredBottleId(p.id); hoveredRef.current = document.getElementById(`bottle-${p.id}`); }}
                    onMouseLeave={() => { setHoveredBottleId(null); hoveredRef.current = null; }}
                  >
                    <div className="pcm-media">
                      <img id={`bottle-${p.id}`} src={p.imageUrl || "/smoke-fallback.jpg"} alt={p.name} loading="lazy" style={{ maxHeight: 72, maxWidth: 72 }} />
                    </div>

                    <div className="pcm-body">
                      <h4>{p.name}</h4>
                      <div className="muted small">{p.description}</div>
                      <div className="pcm-foot">
                        <div className="price">{formatPrice(p.price)}</div>
                        <div className="pcm-actions">
                          <button
                            className="btn small ghost quickview-btn qv-btn"
                            onClick={(e) => {
                              // ripple feedback so the click is felt, not just seen
                              const btn = e.currentTarget;
                              const rect = btn.getBoundingClientRect();
                              const ripple = document.createElement("span");
                              const size = Math.max(rect.width, rect.height) * 1.6;
                              ripple.className = "qv-ripple";
                              ripple.style.width = ripple.style.height = `${size}px`;
                              ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                              ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
                              btn.appendChild(ripple);
                              ripple.addEventListener("animationend", () => ripple.remove());

                              btn.classList.add("qv-pressed");
                              setTimeout(() => btn.classList.remove("qv-pressed"), 220);

                              // navigate to the product details page
                              navigate(`/product/${p.id}`, { state: { product: p } });
                            }}
                          >
                            <span className="qv-icon" aria-hidden="true">👁</span>
                            Quick View
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>

              {(!showAllForMood && filtered.length > 4) && (
                <div className="mood-showmore">
                  <button className="btn ghost" onClick={() => setShowAllForMood(true)}>Show more</button>
                </div>
              )}

              {showAllForMood && (
                <div className="mood-showmore">
                  <button className="btn ghost" onClick={() => setShowAllForMood(false)}>Show less</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottle-hover emitter (emits from hovered bottle element) */}
      {hoveredBottleId && hoveredRef.current && (
        <ScentEmitter
          targetRef={{ current: hoveredRef.current }}
          colors={MOODS.find((m) => m.id === activeMood)?.color || ["rgba(200,110,220,0.95)"]}
          enabled={true}
          density={18}
          size={[4, 20]}
          drift={{ x: 0.04, y: -0.22 }}
        />
      )}
    </section>
  );
}
