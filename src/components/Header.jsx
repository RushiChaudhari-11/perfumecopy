// src/components/Header.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import PillNav from "./PillNav";
import "../styles/header.css";

// ─── Nav data ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Home", href: "/", path: "/" },
  { label: "Men", href: "/collections/men", path: "/collections/men" },
  { label: "Women", href: "/collections/women", path: "/collections/women" },
  { label: "Collections", href: "/#featured-collections", path: "/#featured-collections" },
  { label: "About", href: "/about", path: "/about" },
];

const PROMO_MESSAGES = [
  {
    message: "New arrivals: Shop the latest collection",
    linkLabel: "SHOP NOW",
    href: "/#featured-collections",
  },
];



function getInitial(user) {
  if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
  if (user?.email)       return user.email.charAt(0).toUpperCase();
  return "U";
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function IconSearch() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg {...iconProps}>
      <path d="M12 20.5s-7.5-4.7-10-9.2C.6 8.1 2 4.5 5.4 3.7 7.7 3.1 10 4.2 12 6.5c2-2.3 4.3-3.4 6.6-2.8 3.4.8 4.8 4.4 3.4 7.6-2.5 4.5-10 9.2-10 9.2z" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="19" cy="20" r="1.5" />
      <path d="M1 1h4l2.6 12a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L23 5H6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="9.5" r="3" />
      <path d="M6.3 18.5a4.5 4.5 0 0 1 4.2-2.9h3a4.5 4.5 0 0 1 4.2 2.9" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg {...iconProps} width="16" height="16">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg {...iconProps} width="16" height="16">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function Header() {
  const {
    currentUser,
    user,
    loading,
    logout,
    signInWithGoogle,
  } = useAuth();

  const { totalQty: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const activeUser = currentUser ?? user ?? null;

  const navigate = useNavigate();
  const location = useLocation();
  const currentHref = location.pathname + (location.hash || "");

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [userDropdown,  setUserDropdown]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  const [openMobileSection, setOpenMobileSection] = useState(null);

  const [promoIndex, setPromoIndex] = useState(0);

  const userAreaRef = useRef(null);
  const headerRef = useRef(null);

  // Track window scroll to make header sticky & transition color to #7a1638
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${el.offsetHeight}px`
      );
    };

    setVar();

    const ro = new ResizeObserver(setVar);
    ro.observe(el);

    window.addEventListener("resize", setVar);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) setOpenMobileSection(null);
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!userDropdown) return;
    const handler = (e) => {
      if (userAreaRef.current && !userAreaRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userDropdown]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserDropdown(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (PROMO_MESSAGES.length <= 1) return;
    const id = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_MESSAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    setUserDropdown(false);

    if (path.includes("#")) {
      const [base, hash] = path.split("#");
      const targetBase = base || "/";

      if (window.location.pathname !== targetBase) {
        navigate(targetBase);
        setTimeout(() => scrollToId(hash), 300);
      } else {
        scrollToId(hash);
      }
      return;
    }

    if (path === "/" && window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUserDropdown(false);
      setMenuOpen(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in failed:", err);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleMobileSection = (label) => {
    setOpenMobileSection((prev) => (prev === label ? null : label));
  };

  const goToPromo = (delta) => {
    setPromoIndex((i) => {
      const len = PROMO_MESSAGES.length;
      return (i + delta + len) % len;
    });
  };

  const activePromo = PROMO_MESSAGES[promoIndex];

  return (
    <>
      <div ref={headerRef} className={`site-header-fixed ${scrolled ? "is-scrolled" : ""}`}>
        <header className={`site-header pill-site-header ${scrolled ? "is-scrolled" : ""}`}>
          <PillNav
            logo="/logo.png"
            logoAlt="Perfume Copy"
            logoHref="/"
            items={NAV_ITEMS}
            activeHref={currentHref}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            layout="split"
            surface="glass"
            size="md"
            bounce={0.3}
            stretch={0.5}
            collapse="auto"
            intro
            className={scrolled ? "is-scrolled" : ""}
            onItemClick={(item, e) => {
              e.preventDefault();
              handleNav(item.href || item.path);
            }}
            actions={
              <div className="header-actions">
                {/* Search */}
                <button
                  className="icon-btn"
                  aria-label="Search"
                  onClick={() => handleNav("/search")}
                >
                  <IconSearch />
                </button>

                {/* Auth area */}
                <div className="header-auth-desktop">
                  {loading ? (
                    <div className="avatar-skeleton" aria-hidden="true" />
                  ) : activeUser ? (
                    <div className="user-area" ref={userAreaRef}>
                      <button
                        className="avatar-btn"
                        onClick={() => setUserDropdown((v) => !v)}
                        aria-label="Open user menu"
                        aria-expanded={userDropdown}
                        aria-haspopup="menu"
                      >
                        {activeUser.photoURL ? (
                          <img
                            src={activeUser.photoURL}
                            alt={activeUser.displayName || "User avatar"}
                            className="avatar-img"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="avatar-initials" aria-hidden="true">
                            {getInitial(activeUser)}
                          </div>
                        )}
                      </button>

                      {userDropdown && (
                        <div className="user-dropdown" role="menu">
                          <p className="user-display-name">
                            {activeUser.displayName || activeUser.email}
                          </p>

                          {activeUser.isAdmin && (
                            <span className="admin-badge" aria-label="Admin user">
                              Admin
                            </span>
                          )}

                          <button role="menuitem" onClick={() => handleNav("/account")}>
                            My Account
                          </button>
                          <button role="menuitem" onClick={() => handleNav("/orders")}>
                            Orders
                          </button>
                          <button role="menuitem" onClick={() => handleNav("/wishlist")}>
                            Wishlist
                          </button>

                          {activeUser.isAdmin && (
                            <button role="menuitem" onClick={() => handleNav("/admin")}>
                              Admin Panel
                            </button>
                          )}
                          {activeUser.isAdmin && (
                            <button role="menuitem" onClick={() => handleNav("/admin/journal")}>
                              Manage Journal
                            </button>
                          )}

                          <button
                            role="menuitem"
                            className="logout-item"
                            onClick={handleLogout}
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className="icon-btn"
                      aria-label="Account — log in"
                      onClick={() => handleNav("/login")}
                    >
                      <IconUser />
                    </button>
                  )}
                </div>

                {/* Cart */}
                <button
                  className="icon-btn"
                  aria-label={`Cart — ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
                  onClick={() => handleNav("/cart")}
                >
                  <IconBag />
                  <span className="icon-badge" aria-hidden="true">{cartCount}</span>
                </button>

                {/* Wishlist */}
                <button
                  className="icon-btn"
                  aria-label={`Wishlist — ${wishlistCount} item${wishlistCount !== 1 ? "s" : ""}`}
                  onClick={() => handleNav("/wishlist")}
                >
                  <IconHeart />
                  <span className="icon-badge" aria-hidden="true">{wishlistCount}</span>
                </button>

                {/* Hamburger (mobile only) */}
                <button
                  className={`hamburger${menuOpen ? " open" : ""}`}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                >
                  <span /><span /><span />
                </button>
              </div>
            }
            mobileOpen={menuOpen}
            onMobileToggle={(open) => setMenuOpen(open)}
          />
        </header>
      </div>

      <div className="header-spacer" aria-hidden="true" />

      {/* ════════════════════════════════════════════════
          MOBILE FULL-SCREEN MENU
      ════════════════════════════════════════════════ */}
      <nav
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <ul className="mobile-nav">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <li key={item.label}>
                <button
                  type="button"
                  className="mobile-section-title"
                  onClick={() => toggleMobileSection(item.label)}
                  aria-expanded={openMobileSection === item.label}
                >
                  {item.label}
                  <i className={`mobile-chevron${openMobileSection === item.label ? " rotated" : ""}`}>
                    &gt;
                  </i>
                </button>
                <ul className={`mobile-sub${openMobileSection === item.label ? " open" : ""}`}>
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <a
                        href={child.path}
                        onClick={(e) => { e.preventDefault(); handleNav(child.path); }}
                      >
                        {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.label}>
                <a
                  className="mobile-nav-link"
                  href={item.path}
                  onClick={(e) => { e.preventDefault(); handleNav(item.path); }}
                >
                  {item.label}
                </a>
              </li>
            )
          )}

          {/* Account + Admin links — only when signed in */}
          {activeUser && !loading && (
            <li>
              <a
                className="mobile-nav-link"
                href="/account"
                onClick={(e) => { e.preventDefault(); handleNav("/account"); }}
              >
                My Account
              </a>
            </li>
          )}
          {activeUser?.isAdmin && !loading && (
            <li>
              <a
                className="mobile-nav-link"
                href="/admin"
                onClick={(e) => { e.preventDefault(); handleNav("/admin"); }}
              >
                Admin Panel
              </a>
            </li>
          )}
          {activeUser?.isAdmin && !loading && (
            <li>
              <a
                className="mobile-nav-link"
                href="/admin/journal"
                onClick={(e) => { e.preventDefault(); handleNav("/admin/journal"); }}
              >
                Manage Journal
              </a>
            </li>
          )}
        </ul>

        {/* Mobile footer — auth actions + icon row.
            This is now the ONLY place login/account details show on
            mobile — the .header-auth-desktop block up top is hidden
            below 960px via CSS, so there's no more duplication. */}
        <div className="mobile-footer">
          {loading ? (
            <div className="avatar-skeleton" style={{ width: 120, borderRadius: 2 }} aria-hidden="true" />
          ) : activeUser ? (
            <>
              <p className="mobile-user-name">
                {activeUser.displayName || activeUser.email}
              </p>
              {activeUser.isAdmin && (
                <span className="admin-badge" aria-label="Admin user" style={{ marginBottom: 10 }}>
                  Admin
                </span>
              )}
              <button className="mobile-cta" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                className="mobile-cta mobile-cta-login"
                onClick={() => handleNav("/login")}
              >
                Login
              </button>
              <button
                className="mobile-google-btn"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                aria-label="Sign in with Google"
              >
                {googleLoading ? (
                  <span className="btn-spinner" aria-hidden="true" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </>
          )}

          <div className="mobile-footer-icons">
            <button
              className="icon-btn"
              aria-label="Search"
              onClick={() => handleNav("/search")}
            >
              <IconSearch />
            </button>
            <button
              className="icon-btn"
              aria-label={`Wishlist — ${wishlistCount} items`}
              onClick={() => handleNav("/wishlist")}
              style={{ position: "relative" }}
            >
              <IconHeart />
              {wishlistCount > 0 && (
                <span className="cart-badge" aria-hidden="true">{wishlistCount}</span>
              )}
            </button>
            <button
              className="icon-btn"
              aria-label={`Cart — ${cartCount} items`}
              onClick={() => handleNav("/cart")}
              style={{ position: "relative" }}
            >
              <IconBag />
              {cartCount > 0 && (
                <span className="cart-badge" aria-hidden="true">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
