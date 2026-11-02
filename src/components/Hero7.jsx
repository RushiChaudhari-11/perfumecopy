// src/components/Hero7.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./Hero7.css";

export const HERO_SLIDES = [
  {
    id: "signature-fragrances",
    index: 0,
    title: "Signature Fragrances",
    caption: "Luxury Hero Collection",
    image: "/Signature Fragrances Luxury Hero Banner.png",
    alt: "Signature Fragrances Luxury Hero Banner",
    objectPosition: "center 72%",
  },
  {
    id: "botanical-freshener",
    index: 1,
    title: "Botanical Room Freshener",
    caption: "Premium Botanical Collection",
    image: "/Premium Botanical Room Freshener Banner.png",
    alt: "Premium Botanical Room Freshener Banner",
    objectPosition: "center center",
  },
  {
    id: "stone-series",
    index: 2,
    title: "Stone Series",
    caption: "Fragrance Body Spray Collection",
    image: "/Stone Series Fragrance Collection.png",
    alt: "Stone Series Fragrance Collection",
    objectPosition: "center center",
  },
];

// Lightweight organic perfume smoke particle
class SmokePuff {
  constructor(w, h, isBurst = false) {
    this.reset(w, h, isBurst);
  }

  reset(w, h, isBurst = false) {
    this.x = isBurst ? w * (0.25 + Math.random() * 0.5) : Math.random() * w;
    this.y = isBurst ? h * (0.55 + Math.random() * 0.35) : h + 20 + Math.random() * 40;
    this.radius = isBurst ? 80 + Math.random() * 90 : 100 + Math.random() * 130;
    this.maxRadius = this.radius * (1.6 + Math.random() * 0.7);
    this.vx = (Math.random() - 0.5) * (isBurst ? 1.4 : 0.5);
    this.vy = -(0.35 + Math.random() * (isBurst ? 1.1 : 0.6));
    this.alpha = 0;
    this.maxAlpha = 0.11 + Math.random() * 0.13;
    this.life = 0;
    this.maxLife = isBurst ? 80 + Math.random() * 40 : 160 + Math.random() * 90;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    this.life += 1;
    const progress = this.life / this.maxLife;

    if (progress < 0.25) {
      this.alpha = (progress / 0.25) * this.maxAlpha;
    } else {
      this.alpha = (1 - (progress - 0.25) / 0.75) * this.maxAlpha;
    }

    this.radius += (this.maxRadius - this.radius) * 0.009;
    return this.life < this.maxLife && this.y > -this.radius;
  }

  draw(ctx) {
    if (this.alpha <= 0.003) return;
    const grad = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius
    );
    grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha * 0.85})`);
    grad.addColorStop(0.35, `rgba(252, 248, 240, ${this.alpha * 0.45})`);
    grad.addColorStop(0.7, `rgba(245, 240, 230, ${this.alpha * 0.15})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Subtle golden scent mist micro-droplet
class ScentDroplet {
  constructor(w, h) {
    this.reset(w, h);
  }

  reset(w, h) {
    this.x = Math.random() * w;
    this.y = h * 0.4 + Math.random() * (h * 0.6);
    this.size = 1 + Math.random() * 2;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = -(0.25 + Math.random() * 0.45);
    this.alpha = 0.1 + Math.random() * 0.5;
    this.vAlpha = 0.01 + Math.random() * 0.015;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha += this.vAlpha;
    if (this.alpha > 0.75 || this.alpha < 0.1) {
      this.vAlpha = -this.vAlpha;
    }
    if (this.y < 0) this.reset(w, h);
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(238, 215, 168, ${Math.max(0, this.alpha)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function Hero7({ onCtaClick }) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const slideRefs = useRef([]);
  const canvasRef = useRef(null);
  const progressRef = useRef(null);
  const progressTweenRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const burstTriggerRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = HERO_SLIDES.length;

  // Handle click on banner -> smooth scroll to products
  const handleBannerClick = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    const target = document.querySelector("#featured-collections");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 1. Organic Smoke Canvas Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = 0;
    let height = 0;

    let puffs = [];
    let droplets = [];

    const resize = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Initialize ambient smoke puffs & scent droplets
      puffs = Array.from({ length: 16 }).map(() => new SmokePuff(width, height));
      droplets = Array.from({ length: 18 }).map(() => new ScentDroplet(width, height));
    };

    resize();
    window.addEventListener("resize", resize);

    // Trigger burst on slide change
    burstTriggerRef.current = () => {
      if (width === 0 || height === 0) return;
      const burstCount = 10;
      for (let i = 0; i < burstCount; i++) {
        puffs.push(new SmokePuff(width, height, true));
      }
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw smoke puffs
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        const alive = p.update(width, height);
        if (alive) {
          p.draw(ctx);
        } else {
          // If ambient puff, reset it; if burst puff, remove it
          if (puffs.length > 16) {
            puffs.splice(i, 1);
          } else {
            p.reset(width, height);
          }
        }
      }

      // Update and draw scent droplets
      droplets.forEach((d) => {
        d.update(width, height);
        d.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 2. Premium GSAP Cinematic Slide Transition with Smoke Mist Burst
  const goToSlide = useCallback((targetIndex, direction = 1) => {
    if (isAnimatingRef.current) return;
    const nextIndex = (targetIndex + totalSlides) % totalSlides;
    if (nextIndex === currentIndex) return;

    isAnimatingRef.current = true;

    // Trigger authentic mist burst on canvas
    if (burstTriggerRef.current) {
      burstTriggerRef.current();
    }

    const currentSlideEl = slideRefs.current[currentIndex];
    const nextSlideEl = slideRefs.current[nextIndex];

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        setCurrentIndex(nextIndex);
        isAnimatingRef.current = false;
        if (currentSlideEl) {
          gsap.set(currentSlideEl, { zIndex: 0, opacity: 0 });
        }
      },
    });

    // Layer incoming slide on top
    if (nextSlideEl) {
      gsap.set(nextSlideEl, { zIndex: 2, opacity: 0, display: "block" });
    }
    if (currentSlideEl) {
      gsap.set(currentSlideEl, { zIndex: 1 });
    }

    // A. Incoming Slide: Soft Focus Bloom & Gentle Parallax
    if (nextSlideEl) {
      const nextImg = nextSlideEl.querySelector(".hero-banner-image");

      tl.fromTo(
        nextSlideEl,
        {
          opacity: 0,
          xPercent: direction * 5,
        },
        {
          opacity: 1,
          xPercent: 0,
          duration: 1.15,
        },
        0
      );

      if (nextImg) {
        tl.fromTo(
          nextImg,
          {
            scale: 1.07,
            filter: "blur(8px) brightness(1.15)",
          },
          {
            scale: 1,
            filter: "blur(0px) brightness(1)",
            duration: 1.35,
            ease: "power2.out",
          },
          0
        );
      }
    }

    // B. Outgoing Slide: Graceful Drift & Soft Dissolve
    if (currentSlideEl) {
      const currentImg = currentSlideEl.querySelector(".hero-banner-image");

      tl.to(
        currentSlideEl,
        {
          opacity: 0,
          xPercent: direction * -4,
          duration: 1.0,
        },
        0
      );

      if (currentImg) {
        tl.to(
          currentImg,
          {
            scale: 1.04,
            filter: "blur(4px)",
            duration: 1.05,
          },
          0
        );
      }
    }

    // C. Reset & Animate Progress Bar
    if (progressRef.current) {
      if (progressTweenRef.current) progressTweenRef.current.kill();
      gsap.set(progressRef.current, { scaleX: 0 });
      progressTweenRef.current = gsap.to(progressRef.current, {
        scaleX: 1,
        duration: 5.5,
        ease: "none",
        transformOrigin: "left center",
      });
    }
  }, [currentIndex, totalSlides]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1, 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1, -1);
  }, [currentIndex, goToSlide]);

  // Autoplay loop every 5.5s
  useEffect(() => {
    if (isPaused) {
      if (progressTweenRef.current) progressTweenRef.current.pause();
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    if (progressTweenRef.current) progressTweenRef.current.resume();

    if (progressRef.current && !progressTweenRef.current) {
      gsap.set(progressRef.current, { scaleX: 0 });
      progressTweenRef.current = gsap.to(progressRef.current, {
        scaleX: 1,
        duration: 5.5,
        ease: "none",
        transformOrigin: "left center",
      });
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Initial Mount: Reveal initial slide cleanly
  useEffect(() => {
    slideRefs.current.forEach((el, idx) => {
      if (el) {
        if (idx === 0) {
          gsap.set(el, { opacity: 1, zIndex: 1, xPercent: 0 });
          const img = el.querySelector(".hero-banner-image");
          if (img) gsap.set(img, { scale: 1, filter: "blur(0px)" });
        } else {
          gsap.set(el, { opacity: 0, zIndex: 0, xPercent: 0 });
        }
      }
    });
  }, []);

  // Touch swipe support for mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <section
      ref={containerRef}
      className="hero-slider-section"
      aria-label="High Quality Hero Advertisements"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-width Carousel Viewport */}
      <div ref={viewportRef} className="hero-slider-viewport">
        {/* Slides Stack */}
        <div className="hero-slides-stack">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              ref={(el) => (slideRefs.current[idx] = el)}
              className={`hero-slide-item ${currentIndex === idx ? "active" : ""}`}
              onClick={handleBannerClick}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="hero-banner-image"
                style={{ objectPosition: slide.objectPosition || "center top" }}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              <div className="hero-slide-overlay" />
            </div>
          ))}
        </div>

        {/* Pure Atmospheric Smoke & Perfume Mist Canvas (Zero Video Artifacts) */}
        <canvas ref={canvasRef} className="hero-smoke-canvas" aria-hidden="true" />

        {/* Ambient Mist Vignette */}
        <div className="hero-smoke-wisps" aria-hidden="true" />

        {/* Prev / Next Navigation Arrows */}
        <button
          type="button"
          className="hero-arrow-btn prev"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          aria-label="Previous Slide"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          className="hero-arrow-btn next"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          aria-label="Next Slide"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Floating Bottom Navigation: Progress Bar & Minimal Luxury Dots (Zero Name Tags) */}
      <div className="hero-slider-controls">
        {/* Animated Progress Bar */}
        <div className="hero-progress-rail">
          <div ref={progressRef} className="hero-progress-bar" />
        </div>

        {/* Minimal Luxury Dots (No Name Tags) */}
        <div className="hero-slider-dots">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`hero-slider-dot ${currentIndex === idx ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx, idx > currentIndex ? 1 : -1);
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
