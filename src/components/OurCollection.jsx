import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./OurCollection.css";

gsap.registerPlugin(ScrollTrigger);

const COLLECTIONS = [
  {
    id: "perfumes",
    name: "PERFUMES",
    subtitle: "Luxury Eau de Parfum & Extraits",
    image: "/collection-perfumes-4k.jpg",
    link: "/collections/perfumes",
    badge: "Bestseller",
    count: "24 Items",
  },
  {
    id: "nano-freshners",
    name: "NANO FRESHNERS",
    subtitle: "Long-Lasting Exotic Fragrances",
    image: "/collection-nano-4k.jpg",
    link: "/collections/nano-freshners",
    badge: "Pocket Luxe",
    count: "12 Items",
  },
  {
    id: "gift-sets",
    name: "GIFT SETS",
    subtitle: "Premium Discovery Collections",
    image: "/collection-giftsets-4k.jpg",
    link: "/collections/gift-sets",
    badge: "Exclusive",
    count: "8 Sets",
  },
  {
    id: "air-fresheners",
    name: "AIR FRESHENERS",
    subtitle: "Botanical Room & Car Sprays",
    image: "/collection-airfresheners-4k.jpg",
    link: "/collections/air-fresheners",
    badge: "Fresh",
    count: "16 Items",
  },
  {
    id: "deodorants",
    name: "DEODORANTS",
    subtitle: "Long-Lasting Perfumed Body Spray",
    image: "/collection-deodorants-4k.jpg",
    link: "/collections/deodorants",
    badge: "Signature",
    count: "18 Items",
  },
  {
    id: "body-talc",
    name: "BODY TALC",
    subtitle: "French Fragrance Deodorant Talc",
    image: "/collection-bodytalc-4k.jpg",
    link: "/collections/body-talc",
    badge: "New Arrival",
    count: "10 Items",
  },
];

export default function OurCollection() {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const pillRef = useRef(null);
  const titleWordsRef = useRef([]);
  const accentLineRef = useRef(null);
  const subTextRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 15);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const ensureVisible = () => {
      if (!sectionRef.current) return;
      const elements = sectionRef.current.querySelectorAll(".our-collection-card, .collection-word, .collection-eyebrow-pill, .collection-sub");
      elements.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "none";
      });
    };

    const ctx = gsap.context(() => {
      // 1. Header Text Reveal
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

      // 2. Collection Cards Stagger Entrance
      const cards = el.querySelectorAll(".our-collection-card");
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

    const timer = setTimeout(ensureVisible, 800);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      ctx.revert();
    };
  }, []);

  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 300);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="featured-collections"
      ref={sectionRef}
      className="our-collection-section"
      aria-label="Our Collection"
    >
      <div className="our-collection-container">
        {/* Section Header with Centered GSAP Masked Text Animation */}
        <div className="our-collection-header" ref={headerRef}>
          <div className="our-collection-header-text">
            <div className="our-collection-eyebrow-wrap">
              <span className="our-collection-eyebrow-pill" ref={pillRef}>
                <span className="eyebrow-star">✦</span> SIGNATURE ATELIER
              </span>
            </div>
            <h2 className="our-collection-title">
              <span className="col-title-mask">
                <span
                  className="col-word our-collection-accent"
                  ref={(el) => (titleWordsRef.current[0] = el)}
                >
                  Our
                  <span className="col-accent-underline" ref={accentLineRef} />
                </span>
              </span>{" "}
              <span className="col-title-mask">
                <span className="col-word" ref={(el) => (titleWordsRef.current[1] = el)}>
                  Collection
                </span>
              </span>
            </h2>
            <p className="our-collection-sub" ref={subTextRef}>
              Explore our curated repertoire of luxury extraits, artisanal fresheners, and perfumed essentials.
            </p>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="our-collection-wrapper">
          {/* Floating Left Arrow on Card Track */}
          {canScrollLeft && (
            <button
              className="our-collection-floating-arrow prev"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="our-collection-track" ref={trackRef}>
            {COLLECTIONS.map((item, index) => (
              <div
                key={item.id}
                className="our-collection-card"
                onClick={() => navigate(item.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(item.link);
                }}
              >
                <div className="our-collection-media">
                  {/* Subtle top category tag */}
                  <span className="our-collection-tag">{item.badge}</span>
                  
                  {/* High Quality Product Photo */}
                  <div className="our-collection-img-wrap">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="our-collection-img"
                      loading="lazy"
                    />
                  </div>

                  {/* Hover Quick Action Pill */}
                  <div className="our-collection-hover-overlay">
                    <span className="our-collection-hover-btn">
                      Explore Scents
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Iconic Gold Signature Banner */}
                <div className="our-collection-bar">
                  <span className="our-collection-name">{item.name}</span>
                  <span className="our-collection-arrow-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Right Arrow on Card Track (Matching user screenshot) */}
          {canScrollRight && (
            <button
              className="our-collection-floating-arrow"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

