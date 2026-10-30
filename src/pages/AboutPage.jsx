// src/pages/AboutPage.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SEO from "../components/SEO";
import "../styles/AboutPage.css";

gsap.registerPlugin(ScrollTrigger);

const OLFACTORY_NOTES = [
  {
    step: "01",
    tag: "Top Note",
    sub: "The Awakening • First Encounter",
    title: "An unforgettable inaugural breath.",
    desc: "The luminous opening that captures the atmosphere the moment you enter. Crafted with sun-drenched Calabrian bergamot, hand-selected pink peppercorn, and delicate morning-picked orange blossom. It is designed not to shout, but to captivate with effortless poise.",
    accords: ["Calabrian Bergamot", "Pink Peppercorn", "Dawn-Picked Neroli"],
    align: "left",
  },
  {
    step: "02",
    tag: "Heart Note",
    sub: "The Persona • Emotional Core",
    title: "The soul that blooms with warmth.",
    desc: "As the top notes gently yield, the true identity of the extrait unfolds on warm skin. We distill rare Damascena rose absolute, Florentine iris butter, and golden saffron threads. This heart note beats with quiet authority, projecting timeless refinement and understated luxury.",
    accords: ["Grasse Rose Centifolia", "Tuscan Iris Butter", "Golden Kashmiri Saffron"],
    align: "right",
  },
  {
    step: "03",
    tag: "Base Note",
    sub: "The Legacy • Enduring Sillage",
    title: "The presence that lingers forever.",
    desc: "Base notes are the immortal memory of an encounter. We age sustainably sourced Cambodian agarwood (oud), raw ambergris, and sun-cured Madagascar bourbon vanilla for months before bottling. The result is an indelible sillage that remains etched in the air long after you have moved on.",
    accords: ["Aged Cambodian Agarwood", "Smoked White Amber", "Madagascar Bourbon Vanilla"],
    align: "left",
  },
];

const ATELIER_PILLARS = [
  {
    icon: "✦",
    title: "Noble Origins",
    desc: "Every botanical extract is sustainably harvested from its historic geographic provenance — from dawn-picked centifolia roses in Grasse to aged wild agarwood in Southeast Asia.",
  },
  {
    icon: "✧",
    title: "Artisanal Maceration",
    desc: "We cap every run to small numbered batches. Each batch undergoes a rigorous 8-week barrel maceration in lightless rooms, allowing raw essences to mature into symphonic balance.",
  },
  {
    icon: "✦",
    title: "Extrait Concentration",
    desc: "While commercial scents settle for 10-15% fragrance oil, our formulations boast a generous 28% to 32% pure extrait concentration, ensuring extraordinary 14+ hour longevity.",
  },
  {
    icon: "✧",
    title: "Conscious Haute Parfumerie",
    desc: "100% cruelty-free and vegan formulated. We prohibit phthalates, parabens, and synthetic dyes, letting the pure natural color of aged resins and botanical oils shine through.",
  },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    // Smooth GSAP reveal for hero elements
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-hero-animate",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );

      gsap.fromTo(
        ".about-stat-item",
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, delay: 0.3, ease: "back.out(1.4)" }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="luxury-about-page" ref={heroRef}>
      <SEO
        title="About Our Atelier | Perfume Copy Luxury Fragrances"
        description="Discover the story and artisanal heritage of Perfume Copy. Mastercrafted small-batch extrait de parfums with 30% concentration and rare botanical essences."
        url="http://www.perfumecopy.com/about"
        image="http://www.perfumecopy.com/logo.png"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Perfume Copy Atelier",
          "url": "http://www.perfumecopy.com/about",
          "description": "Artisanal haute parfumerie creating small-batch luxury extraits with 30% concentration.",
          "publisher": {
            "@type": "Organization",
            "name": "Perfume Copy",
            "url": "http://www.perfumecopy.com"
          }
        }}
      />
      {/* ─── 1. Hero Section ─── */}
      <section className="about-hero-section">
        <div className="about-hero-content">
          <span className="about-hero-eyebrow about-hero-animate">
            ✦ MAISON DE HAUTE PARFUMERIE ✦
          </span>
          <h1 className="about-hero-title about-hero-animate">
            Crafted for Eternity.
            <br />
            <span className="about-gold-italic">Worn as a Signature.</span>
          </h1>
          <p className="about-hero-subtitle about-hero-animate">
            Born from an uncompromising reverence for noble botanicals, rare resinous woods,
            and timeless French olfactory craft. We do not manufacture perfume — we capture memory.
          </p>

          <div className="about-hero-actions about-hero-animate">
            <button
              type="button"
              className="about-primary-btn"
              onClick={() => navigate("/collections")}
            >
              <span>Explore The Atelier</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <a href="#heritage" className="about-ghost-btn">
              <span>Read Our Heritage</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Floating Atelier Stats Bar */}
        <div className="about-stats-bar">
          <div className="about-stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Small-Batch Artisanal Runs</span>
          </div>
          <div className="about-stat-divider" />
          <div className="about-stat-item">
            <span className="stat-number">60+</span>
            <span className="stat-label">Days Natural Maceration</span>
          </div>
          <div className="about-stat-divider" />
          <div className="about-stat-item">
            <span className="stat-number">30%</span>
            <span className="stat-label">Pure Extrait Concentration</span>
          </div>
          <div className="about-stat-divider" />
          <div className="about-stat-item">
            <span className="stat-number">0%</span>
            <span className="stat-label">Synthetic Fillers or Dyes</span>
          </div>
        </div>
      </section>

      {/* ─── 2. Brand Genesis & Heritage ─── */}
      <section id="heritage" className="about-heritage-section">
        <div className="about-container">
          <div className="about-heritage-grid">
            <div className="heritage-text-col">
              <span className="section-eyebrow">✦ THE GENESIS ✦</span>
              <h2 className="section-title">
                The Pursuit of the <span className="gold-text">Extraordinary</span>
              </h2>
              <p className="heritage-p lead">
                Signature was founded on a singular conviction: the fragrance industry had traded
                soul for speed, replacing artisanal alchemy with synthetic imitation.
              </p>
              <p className="heritage-p">
                We set out on a different path. Working alongside independent master perfumers in
                Grasse and Florence, we curate the planet’s rarest natural essences. Each harvest
                tells of its season — the mountain rainfall that kissed the Moroccan orris, the desert
                winds that seasoned the Frankincense of Oman.
              </p>
              <p className="heritage-p">
                When you spray a Signature extrait, you are wearing living art, aged to perfection,
                designed to evolve in intimacy with your unique skin chemistry.
              </p>

              <div className="heritage-signature-block">
                <span className="atelier-script">Signature.</span>
                <span className="signature-caption">Maison de Haute Parfumerie • Paris & Grasse</span>
              </div>
            </div>

            <div className="heritage-visual-col">
              <div className="heritage-card-frame">
                <img
                  src="/hero-banner.jpg"
                  alt="Signature Atelier Ingredients & Crystal Flacon"
                  className="heritage-banner-img"
                  loading="lazy"
                />
                <div className="heritage-card-overlay">
                  <div className="overlay-badge">
                    <span className="badge-star">✦</span>
                    <span>ATELIER ARCHIVES</span>
                  </div>
                  <h3 className="overlay-title">Hand-Blended in Grasse, France</h3>
                  <p className="overlay-sub">Where centuries of botanical mastery meet modern haute perfumery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Olfactory Architecture (Top / Heart / Base) ─── */}
      <section className="about-architecture-section">
        <div className="about-container">
          <div className="section-header-center">
            <span className="section-eyebrow">✦ THE ANATOMY OF SCENT ✦</span>
            <h2 className="section-title">
              The Architecture of a <span className="gold-text">Masterpiece</span>
            </h2>
            <div className="gold-ornament-divider">
              <span className="ornament-line" />
              <span className="ornament-star">✦</span>
              <span className="ornament-line" />
            </div>
            <p className="section-subtitle">
              Every Signature extrait is formulated like a three-movement olfactory symphony,
              unfolding organically across hours on skin.
            </p>
          </div>

          <div className="architecture-timeline">
            {OLFACTORY_NOTES.map((note, idx) => (
              <div
                key={note.tag}
                ref={(el) => (cardsRef.current[idx] = el)}
                className={`architecture-step-card ${note.align}`}
              >
                <div className="step-card-inner">
                  <div className="step-card-header">
                    <span className="step-number">{note.step}</span>
                    <div>
                      <span className="step-tag">{note.tag}</span>
                      <span className="step-sub">{note.sub}</span>
                    </div>
                  </div>

                  <h3 className="step-title">{note.title}</h3>
                  <p className="step-desc">{note.desc}</p>

                  <div className="step-accords-wrap">
                    <span className="accords-label">Signature Accords:</span>
                    <div className="accords-pills">
                      {note.accords.map((accord) => (
                        <span key={accord} className="accord-pill">
                          {accord}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Master Quote Break ─── */}
      <section className="about-quote-section">
        <div className="about-container">
          <div className="quote-card">
            <span className="quote-mark">“</span>
            <blockquote className="quote-text">
              Perfume is not an accessory to be worn carelessly. It is the invisible couture
              garment that introduces you before you speak, and lingers as your legend when you depart.
            </blockquote>
            <div className="quote-author-wrap">
              <span className="author-name">François de la Fontaine</span>
              <span className="author-title">Master Nose & Creative Director • Signature Atelier</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. The Pillars of Excellence ─── */}
      <section className="about-pillars-section">
        <div className="about-container">
          <div className="section-header-center">
            <span className="section-eyebrow">✦ UNCOMPROMISING STANDARDS ✦</span>
            <h2 className="section-title">
              The Pillars of <span className="gold-text">Excellence</span>
            </h2>
            <div className="gold-ornament-divider">
              <span className="ornament-line" />
              <span className="ornament-star">✦</span>
              <span className="ornament-line" />
            </div>
          </div>

          <div className="pillars-grid">
            {ATELIER_PILLARS.map((p) => (
              <div key={p.title} className="pillar-card">
                <div className="pillar-icon-halo">{p.icon}</div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Final Discovery CTA ─── */}
      <section className="about-cta-section">
        <div className="about-container">
          <div className="about-cta-card">
            <span className="section-eyebrow">✦ YOUR SCENT JOURNEY ✦</span>
            <h2 className="cta-heading">Find Your Scent Signature</h2>
            <p className="cta-sub">
              Immerse yourself in our private reserves. From opulent orientals to crystalline floraux,
              discover the fragrance that mirrors your soul.
            </p>
            <div className="cta-btn-group">
              <button
                type="button"
                className="about-primary-btn"
                onClick={() => navigate("/collections")}
              >
                <span>Shop All Collections</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button
                type="button"
                className="about-ghost-btn"
                onClick={() => navigate("/collections/men")}
              >
                <span>Explore For Him</span>
              </button>
              <button
                type="button"
                className="about-ghost-btn"
                onClick={() => navigate("/collections/women")}
              >
                <span>Explore For Her</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
