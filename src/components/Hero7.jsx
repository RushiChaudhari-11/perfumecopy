// src/components/Hero7.jsx
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./Hero7.css";

const BOTTLE_ITEMS = [
  {
    id: 1,
    image: "/bottle-trans-ruby.png",
    fallback: "/bottle-clean-ruby.png",
    glow: "rgba(225, 29, 72, 0.28)",
  },
  {
    id: 2,
    image: "/bottle-trans-gold.png",
    fallback: "/bottle-auric-gold.jpg",
    glow: "rgba(234, 179, 8, 0.32)",
  },
  {
    id: 3,
    image: "/bottle-trans-amethyst.png",
    fallback: "/bottle-clean-amethyst.png",
    glow: "rgba(168, 85, 247, 0.28)",
  },
  {
    id: 4,
    image: "/bottle-trans-twist.png",
    fallback: "/bottle-clean-twist.png",
    glow: "rgba(244, 63, 94, 0.28)",
  },
  {
    id: 5,
    image: "/bottle-trans-fleur.png",
    fallback: "/bottle-clean-fleur.png",
    glow: "rgba(251, 113, 133, 0.28)",
  },
];

// 24 animated sparks floating along the center laser beam
const PARTICLES = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  left: (Math.random() - 0.5) * 44,
  delay: Math.random() * 3.5,
  duration: 2.2 + Math.random() * 2.8,
  size: 2 + Math.random() * 4,
  opacity: 0.4 + Math.random() * 0.6,
}));

export default function Hero7({ onCtaClick }) {
  const trackColorRef = useRef(null);
  const trackBwRef = useRef(null);
  const animRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // GSAP Text Animation Refs
  const headerContainerRef = useRef(null);
  const titleWordsRef = useRef([]);
  const accentLineRef = useRef(null);
  const subTextRef = useRef(null);
  const ctaBtnRef = useRef(null);

  // Cinematic GSAP Entrance Animation for Header Text
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Animate masked words sliding up smoothly
      tl.fromTo(
        titleWordsRef.current,
        {
          yPercent: 125,
          rotateX: -20,
          opacity: 0,
        },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          duration: 1.15,
          stagger: 0.12,
        }
      )
      // Unfold the signature accent underline bar
      .fromTo(
        accentLineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.85, ease: "power3.inOut" },
        "-=0.6"
      )
      // Fade & float up subtitle
      .fromTo(
        subTextRef.current,
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85 },
        "-=0.5"
      )
      // Scale-in CTA button with subtle spring
      .fromTo(
        ctaBtnRef.current,
        { scale: 0.88, y: 16, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.6)" },
        "-=0.5"
      );
    }, headerContainerRef);

    return () => ctx.revert();
  }, []);

  // Subtle interactive parallax on mouse move
  const handleMouseMove = (e) => {
    if (!headerContainerRef.current) return;
    const rect = headerContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    gsap.to(titleWordsRef.current, {
      x: x * 8,
      y: y * 5,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.02,
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(titleWordsRef.current, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleCta = (e) => {
    if (e) e.preventDefault();
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    const target = document.querySelector("#featured-collections");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  // GSAP continuous smooth marquee animation across both color & B&W tracks
  useEffect(() => {
    const targets = [trackColorRef.current, trackBwRef.current].filter(Boolean);
    if (!targets.length) return;

    gsap.set(targets, { xPercent: 0 });

    const tween = gsap.to(targets, {
      xPercent: -50,
      duration: 24,
      ease: "none",
      repeat: -1,
    });

    animRef.current = tween;

    return () => {
      tween.kill();
    };
  }, []);

  // Hover pause & resume
  useEffect(() => {
    if (!animRef.current) return;
    if (isPaused) {
      animRef.current.pause();
    } else {
      animRef.current.resume();
    }
  }, [isPaused]);

  // Duplicate items for seamless continuous looping
  const scrollItems = [...BOTTLE_ITEMS, ...BOTTLE_ITEMS];

  const renderTrackItems = (isGrayscale = false) => {
    return scrollItems.map((item, idx) => (
      <div
        key={`${isGrayscale ? "bw" : "color"}-${item.id}-${idx}`}
        className="hero7-bottle-item"
        onClick={handleCta}
      >
        {/* Soft atmospheric aura glow behind bottle */}
        <div
          className="hero7-bottle-aura"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${item.glow} 0%, transparent 65%)`,
          }}
        />

        {/* Clean isolated perfume bottle (NO box, NO text, NO borders) */}
        <img
          src={item.image}
          alt="Luxury Perfume Bottle"
          className="hero7-bottle-img"
          loading={idx < 4 ? "eager" : "lazy"}
          decoding="async"
          onError={(e) => {
            if (item.fallback && e.target.src !== item.fallback) {
              e.target.src = item.fallback;
            }
          }}
        />

        {/* Delicate pedestal floor reflection */}
        <div className="hero7-bottle-reflection" />
      </div>
    ));
  };

  return (
    <section className="hero7-section" aria-label="Hero Showcase">
      {/* Background ambient bloom */}
      <div className="hero7-bg-glow" aria-hidden="true" />

      {/* Top Header Content - GSAP Animated Masked Words & Interactive Tilt */}
      <div
        ref={headerContainerRef}
        className="hero7-header"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <h1 className="hero7-title">
          <span className="hero7-mask">
            <span
              ref={(el) => (titleWordsRef.current[0] = el)}
              className="hero7-word hero7-title-accent"
            >
              Pure
              <span ref={accentLineRef} className="hero7-accent-line" />
            </span>
          </span>{" "}
          <span className="hero7-mask">
            <span
              ref={(el) => (titleWordsRef.current[1] = el)}
              className="hero7-word"
            >
              Luxury
            </span>
          </span>
          <br />
          <span className="hero7-mask">
            <span
              ref={(el) => (titleWordsRef.current[2] = el)}
              className="hero7-word"
            >
              Fragrances
            </span>
          </span>
        </h1>

        <p ref={subTextRef} className="hero7-sub">
          Expert picks for modern, handcrafted niche luxury perfumes.
        </p>

        <a
          ref={ctaBtnRef}
          href="#featured-collections"
          className="hero7-pill-cta"
          onClick={handleCta}
        >
          <span>Explore Collection</span>
          <svg
            className="hero7-cta-arrow"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>

      {/* 3D Curved Perspective Carousel with B&W / Color Split */}
      <div
        className="hero7-viewport"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* RIGHT LAYER: FULL VIBRANT COLOR */}
        <div className="hero7-split-layer hero7-layer-color">
          <div ref={trackColorRef} className="hero7-stage">
            <div className="hero7-track">{renderTrackItems(false)}</div>
          </div>
        </div>

        {/* LEFT LAYER: BLACK & WHITE (CLIPPED TO 50%) */}
        <div className="hero7-split-layer hero7-layer-bw">
          <div ref={trackBwRef} className="hero7-stage">
            <div className="hero7-track">{renderTrackItems(true)}</div>
          </div>
        </div>

        {/* SIGNATURE CENTER GLOW BAR (VERTICAL LASER) WITH PARTICLES */}
        <div className="hero7-laser-bar" aria-hidden="true">
          <div className="hero7-laser-core" />
          <div className="hero7-laser-halo" />

          {/* Glowing flares along the beam */}
          <div className="hero7-laser-flare top" />
          <div className="hero7-laser-flare center" />
          <div className="hero7-laser-flare bottom" />

          {/* Floating animated particle sparks */}
          <div className="hero7-particles">
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                className="hero7-particle"
                style={{
                  left: `calc(50% + ${p.left}px)`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  opacity: p.opacity,
                }}
              />
            ))}
          </div>
        </div>

        {/* Side vignettes */}
        <div className="hero7-vignette left" aria-hidden="true" />
        <div className="hero7-vignette right" aria-hidden="true" />
      </div>
    </section>
  );
}

