// src/components/PillNav.jsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import gsap from "gsap";
import "./PillNav.css";

/**
 * PillNav - Animated pill navigation component based on ReactBits
 * https://reactbits.dev/components/pill-nav
 *
 * @param {string|React.ReactNode} logo - Logo URL or JSX element
 * @param {string} [logoAlt='Company'] - Alt text for the logo
 * @param {string} [logoHref='/'] - URL destination for logo click
 * @param {Array<{label: string, href?: string, icon?: React.ReactNode, onClick?: Function}>} items - Navigation links
 * @param {string} [activeHref='/'] - Currently active href
 * @param {'pill'|'plain'} [itemStyle='pill'] - Visual style of navigation items
 * @param {'fill'|'glide'|'none'} [hoverEffect='fill'] - Hover effect variant
 * @param {'dot'|'pill'|'none'} [indicator='dot'] - Active indicator style
 * @param {'split'|'joined'} [layout='split'] - Layout style
 * @param {'glass'|'solid'} [surface='glass'] - Surface backdrop style
 * @param {'sm'|'md'|'lg'} [size='md'] - Size variant
 * @param {number} [bounce=0.3] - Spring overshoot physics (0 to 1)
 * @param {number} [stretch=0.5] - Indicator deformation during motion (0 to 1)
 * @param {'auto'|'never'} [collapse='auto'] - Responsive collapse behavior
 * @param {boolean} [intro=false] - Mount entrance animation
 * @param {string} [className=''] - Additional CSS classes
 * @param {React.CSSProperties} [style={}] - Inline styles
 * @param {React.ElementType} [linkComponent] - Optional router Link component
 * @param {Function} [onItemClick] - Click handler for nav items: (item, event) => void
 * @param {React.ReactNode} [actions] - Optional slot for right-side action buttons (e.g., search, cart, auth)
 * @param {boolean} [mobileOpen] - Controlled mobile menu open state
 * @param {Function} [onMobileToggle] - Mobile menu toggle callback
 * @param {React.ReactNode} [mobileContent] - Optional mobile menu content
 */
export default function PillNav({
  logo,
  logoAlt = "Company",
  logoHref = "/",
  items = [],
  activeHref = "/",
  itemStyle = "pill",
  hoverEffect = "fill",
  indicator = "dot",
  layout = "split",
  surface = "glass",
  size = "md",
  bounce = 0.3,
  stretch = 0.5,
  collapse = "auto",
  intro = false,
  className = "",
  style = {},
  linkComponent: LinkComponent,
  onItemClick,
  actions = null,
  mobileOpen: controlledMobileOpen,
  onMobileToggle,
  mobileContent = null,
}) {
  const rootRef = useRef(null);
  const linksContainerRef = useRef(null);
  const itemRefs = useRef([]);
  const indicatorRef = useRef(null);
  const logoRef = useRef(null);
  const lastXRef = useRef(0);

  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : internalMobileOpen;

  const handleMobileToggle = () => {
    if (onMobileToggle) {
      onMobileToggle(!isMobileOpen);
    } else {
      setInternalMobileOpen((prev) => !prev);
    }
  };

  // Keep itemRefs array sized correctly
  itemRefs.current = itemRefs.current.slice(0, items.length);

  // Mount intro animation
  useEffect(() => {
    if (intro && rootRef.current) {
      gsap.fromTo(
        rootRef.current,
        { y: -24, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)" }
      );
    }
  }, [intro]);

  const getHref = (item) => item.href || item.path || "";

  // Determine active item index
  const activeIndex = items.findIndex((item) => {
    const href = getHref(item);
    if (!href) return false;
    if (activeHref === href) return true;
    if (href !== "/" && !href.startsWith("/#") && activeHref.startsWith(href)) return true;
    return false;
  });

  // Animate indicator dot or pill
  const updateIndicator = useCallback(
    (targetIndex, animate = true) => {
      const container = linksContainerRef.current;
      const ind = indicatorRef.current;
      if (!container || !ind || targetIndex < 0 || !itemRefs.current[targetIndex]) {
        if (ind) ind.style.opacity = "0";
        return;
      }

      const activeEl = itemRefs.current[targetIndex];
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();

      const offsetLeft = itemRect.left - containerRect.left;
      const itemWidth = itemRect.width;

      if (indicator === "dot") {
        const dotWidth = ind.offsetWidth || 6;
        const targetX = offsetLeft + itemWidth / 2 - dotWidth / 2;

        if (!animate) {
          gsap.set(ind, { x: targetX, opacity: 1, scaleX: 1, scaleY: 1 });
          lastXRef.current = targetX;
          return;
        }

        const tl = gsap.timeline();
        tl.to(ind, {
          x: targetX,
          opacity: 1,
          duration: 0.42,
          ease: `back.out(${1 + bounce * 3.2})`,
        });

        if (stretch > 0) {
          const stretchScale = 1 + stretch * 0.9;
          tl.fromTo(
            ind,
            { scaleX: stretchScale, scaleY: 1 / Math.sqrt(stretchScale) },
            { scaleX: 1, scaleY: 1, duration: 0.35, ease: "power2.out" },
            "<"
          );
        }

        lastXRef.current = targetX;
      } else if (indicator === "pill") {
        if (!animate) {
          gsap.set(ind, { x: offsetLeft, width: itemWidth, opacity: 1 });
          lastXRef.current = offsetLeft;
          return;
        }

        gsap.to(ind, {
          x: offsetLeft,
          width: itemWidth,
          opacity: 1,
          duration: 0.45,
          ease: `back.out(${1 + bounce * 2.5})`,
        });
        lastXRef.current = offsetLeft;
      }
    },
    [indicator, bounce, stretch]
  );

  useLayoutEffect(() => {
    updateIndicator(activeIndex >= 0 ? activeIndex : 0, false);
  }, [activeIndex, updateIndicator]);

  useEffect(() => {
    updateIndicator(activeIndex, true);
  }, [activeIndex, updateIndicator]);

  // Re-adjust on window resize
  useEffect(() => {
    const handleResize = () => {
      updateIndicator(activeIndex, false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, updateIndicator]);

  const handleLinkClick = (item, index, e) => {
    if (onItemClick) {
      onItemClick(item, e);
    }
    if (item.onClick) {
      item.onClick(e);
    }
    if (internalMobileOpen) {
      setInternalMobileOpen(false);
    }
  };

  const rootClasses = [
    "pill-nav-root",
    `layout-${layout}`,
    `surface-${surface}`,
    `size-${size}`,
    `item-style-${itemStyle}`,
    `hover-effect-${hoverEffect}`,
    actions ? "has-actions" : "",
    collapse === "auto" ? "collapse-auto" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Custom link renderer wrapper
  const renderLinkItem = (item, index) => {
    const isActive = activeIndex === index;
    const content = (
      <>
        {hoverEffect === "fill" && <span className="pill-nav-hover-fill" aria-hidden="true" />}
        <span className="pill-nav-label-wrapper">
          <span className="pill-nav-label-track">
            <span className="pill-nav-label primary">{item.label}</span>
            <span className="pill-nav-label duplicate" aria-hidden="true">
              {item.label}
            </span>
          </span>
        </span>
        {item.icon && <span className="pill-nav-item-icon">{item.icon}</span>}
      </>
    );

    const commonProps = {
      className: `pill-nav-link ${isActive ? "active" : ""}`,
      onClick: (e) => handleLinkClick(item, index, e),
      "aria-current": isActive ? "page" : undefined,
    };

    const href = getHref(item);
    if (LinkComponent) {
      return (
        <LinkComponent to={href || "#"} {...commonProps}>
          {content}
        </LinkComponent>
      );
    }

    if (href) {
      return (
        <a href={href} {...commonProps}>
          {content}
        </a>
      );
    }

    return (
      <button type="button" {...commonProps}>
        {content}
      </button>
    );
  };

  return (
    <div ref={rootRef} className={rootClasses} style={style}>
      {/* ─── 1. Logo Capsule (when layout is 'split') ─── */}
      {logo && layout === "split" && (
        <div className="pill-nav-capsule pill-nav-logo-capsule">
          <a
            href={logoHref}
            className="pill-nav-logo-btn"
            aria-label={logoAlt}
            onClick={(e) => {
              if (onItemClick) onItemClick({ label: logoAlt, href: logoHref }, e);
            }}
          >
            {typeof logo === "string" ? (
              <img ref={logoRef} src={logo} alt={logoAlt} className="pill-nav-logo-img" />
            ) : (
              <div ref={logoRef} className="pill-nav-logo-custom">
                {logo}
              </div>
            )}
          </a>
        </div>
      )}

      {/* ─── 2. Main Navigation Links Capsule ─── */}
      <div className="pill-nav-capsule pill-nav-links-capsule" ref={linksContainerRef}>
        {/* Joined Layout Logo */}
        {logo && layout === "joined" && (
          <a
            href={logoHref}
            className="pill-nav-logo-btn joined"
            aria-label={logoAlt}
            onClick={(e) => {
              if (onItemClick) onItemClick({ label: logoAlt, href: logoHref }, e);
            }}
          >
            {typeof logo === "string" ? (
              <img ref={logoRef} src={logo} alt={logoAlt} className="pill-nav-logo-img" />
            ) : (
              <div ref={logoRef} className="pill-nav-logo-custom">
                {logo}
              </div>
            )}
          </a>
        )}

        {/* Sliding active indicator (dot or gliding pill) */}
        {indicator === "dot" && (
          <span ref={indicatorRef} className="pill-nav-indicator-dot" aria-hidden="true" />
        )}
        {indicator === "pill" && (
          <span ref={indicatorRef} className="pill-nav-indicator-pill" aria-hidden="true" />
        )}

        <ul className="pill-nav-list" role="menubar">
          {items.map((item, idx) => (
            <li
              key={item.label || idx}
              ref={(el) => (itemRefs.current[idx] = el)}
              className="pill-nav-item"
              role="none"
            >
              {renderLinkItem(item, idx)}
            </li>
          ))}
        </ul>

        {/* Mobile menu hamburger toggle button (when no custom actions provided) */}
        {collapse === "auto" && !actions && (
          <button
            type="button"
            className={`pill-nav-hamburger ${isMobileOpen ? "open" : ""}`}
            onClick={handleMobileToggle}
            aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        )}
      </div>

      {/* ─── 3. Actions Capsule (Right-side slot: Search, Cart, Auth, CTA) ─── */}
      {actions && (
        <div className="pill-nav-capsule pill-nav-actions-capsule">
          {actions}
        </div>
      )}

      {/* ─── 4. Mobile Dropdown Drawer (when collapse='auto') ─── */}
      {collapse === "auto" && isMobileOpen && (
        <div className="pill-nav-mobile-dropdown">
          <ul className="pill-nav-mobile-list">
            {items.map((item, idx) => {
              const href = getHref(item);
              return (
                <li key={`mobile-${item.label || idx}`} className="pill-nav-mobile-item">
                  <a
                    href={href || "#"}
                    className={`pill-nav-mobile-link ${activeIndex === idx ? "active" : ""}`}
                    onClick={(e) => handleLinkClick(item, idx, e)}
                  >
                    {item.icon && <span className="pill-nav-mobile-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          {mobileContent && <div className="pill-nav-mobile-extra">{mobileContent}</div>}
        </div>
      )}
    </div>
  );
}
