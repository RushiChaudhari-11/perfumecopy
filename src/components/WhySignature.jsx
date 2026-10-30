import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./WhySignature.css";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    id: "unique",
    title: "Unique Fragrances",
    desc: "Bespoke formulations crafted with rare essences by master French perfumers.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2h4" />
        <path d="M12 2v4" />
        <rect x="6" y="6" width="12" height="15" rx="3" />
        <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M9 17h6" />
        <path d="M17 4l2-2" />
        <path d="M7 4L5 2" />
      </svg>
    ),
    badge: "Bespoke",
  },
  {
    id: "unisex",
    title: "Unisex",
    desc: "Harmonious scent profiles designed to effortlessly transcend all gender boundaries.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 8V2m0 0l-2.5 2.5M12 2l2.5 2.5" />
        <path d="M12 16v6m-3-3h6" />
        <path d="M8 12H2m2.5-2.5L2 12l2.5 2.5" />
      </svg>
    ),
    badge: "Versatile",
  },
  {
    id: "cruelty-free",
    title: "Cruelty Free",
    desc: "Ethically sourced botanicals, 100% vegan formulation and never tested on animals.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        <path d="M12 8v5" />
        <path d="M9.5 10.5L12 13l2.5-2.5" />
      </svg>
    ),
    badge: "100% Ethical",
  },
  {
    id: "long-lasting",
    title: "Highly Long-lasting",
    desc: "Ultra-concentrated Extrait de Parfum ensuring a captivating sillage that lingers 14+ hours.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <path d="M22 6l-3-3" />
        <path d="M2 6l3-3" />
      </svg>
    ),
    badge: "14+ Hours",
  },
  {
    id: "skin-friendly",
    title: "Skin Friendly",
    desc: "IFRA certified clean ingredients, hypoallergenic, zero toxic phthalates or parabens.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    badge: "Pure & Safe",
  },
];

export default function WhySignature() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const pillRef = useRef(null);
  const titleWordsRef = useRef([]);
  const accentLineRef = useRef(null);
  const subTextRef = useRef(null);

  useEffect(() => {
    // Guarantees all cards and text elements are 100% visible
    const ensureVisible = () => {
      if (!sectionRef.current) return;
      const elements = sectionRef.current.querySelectorAll(".why-feature-card, .why-word, .why-signature-eyebrow-pill, .why-signature-sub");
      elements.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    };

    const ctx = gsap.context(() => {
      // 1. Header Text Staggered Reveal Animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        },
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set([pillRef.current, titleWordsRef.current, accentLineRef.current, subTextRef.current], {
            clearProps: "all",
          });
        },
      });

      tl.fromTo(
        pillRef.current,
        { opacity: 0.3, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5 }
      )
        .fromTo(
          titleWordsRef.current,
          {
            yPercent: 60,
            opacity: 0.3,
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
          },
          "-=0.3"
        )
        .fromTo(
          accentLineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.6, ease: "power2.inOut" },
          "-=0.4"
        )
        .fromTo(
          subTextRef.current,
          { opacity: 0.4, y: 15 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        );

      // 2. Feature Cards Stagger Entrance
      const cards = sectionRef.current.querySelectorAll(".why-feature-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          {
            opacity: 0.4,
            y: 25,
            scale: 0.97,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    // Fallback timer so that under any mobile emulation or fast scroll, cards are never blank
    const timer = setTimeout(ensureVisible, 800);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="why-signature-section" aria-label="Why Signature">
      <div className="why-signature-container">
        {/* Header with GSAP Text Animation */}
        <div className="why-signature-header" ref={headerRef}>
          <div className="why-signature-eyebrow-wrap">
            <span className="why-signature-eyebrow-pill" ref={pillRef}>
              <span className="eyebrow-star">✦</span> OUR QUALITY PROMISE
            </span>
          </div>
          <h2 className="why-signature-title">
            <span className="why-title-mask">
              <span className="why-word" ref={(el) => (titleWordsRef.current[0] = el)}>
                Why
              </span>
            </span>{" "}
            <span className="why-title-mask">
              <span
                className="why-word why-signature-accent"
                ref={(el) => (titleWordsRef.current[1] = el)}
              >
                Signature
                <span className="why-accent-underline" ref={accentLineRef} />
              </span>
            </span>
            <span className="why-title-mask">
              <span className="why-word" ref={(el) => (titleWordsRef.current[2] = el)}>
                ?
              </span>
            </span>
          </h2>
          <p className="why-signature-sub" ref={subTextRef}>
            Crafted without compromises — every bottle represents an unyielding devotion to artisanal perfumery, clean formulation, and enduring elegance.
          </p>
        </div>

        {/* 5 Distinct Feature Cards */}
        <div className="why-signature-grid">
          {FEATURES.map((item) => (
            <div key={item.id} className="why-feature-card">
              <div className="why-icon-bubble">
                <div className="why-icon-inner">{item.icon}</div>
              </div>
              <h3 className="why-feature-title">{item.title}</h3>
              <p className="why-feature-desc">{item.desc}</p>
              <span className="why-feature-badge">{item.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
