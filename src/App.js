// src/App.js
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Core pages
import Homepage from "./Homepage";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import WishlistPage from "./WishlistPage";
import SearchPage from "./pages/SearchPage";

import FindYourScent from "./FindYourScent";
import CheckoutPage from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";

// About page
import AboutPage from "./pages/AboutPage"; // <-- NEW: brand story page (Top/Heart/Base note structure)

// Footer info pages (Shop & Company links)
import InfoPage from "./pages/InfoPage";

// Category listing page (Men/Women/Unisex full collection view)
import CategoryPage from "./pages/CategoryPage";
// Journal (blog) — public pages
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";

// Journal (blog) — admin pages
import BlogAdminList from "./pages/admin/BlogAdminList";
import BlogEditor from "./pages/admin/BlogEditor";

// Context providers
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";

// Components
import Header from "./components/Header";
import TrustBadges from "./components/TrustBadges";
import Footer from "./components/Footer";
import MiniCart from "./components/MiniCart";
import PrivateRoute from "./components/PrivateRoute";
import ScrollToTop from "./components/ScrollToTop"; // <-- NEW: resets scroll on route change

// Admin area - updated to use AdminPanel instead of AdminLayout
import AdminPanel from "./admin/AdminPanel"; // <-- new panel that mounts dashboard/orders/reports

// Optional user pages
import OrdersPage from "./pages/Orders"; // user order history
import OrderStatus from "./pages/OrderStatus"; // <-- NEW: single order tracking (Shiprocket status)

// Automatically syncs canonical link and og:url on route change to live domain http://www.perfumecopy.com
function CanonicalManager() {
  const location = useLocation();

  useEffect(() => {
    const rawPath = location.pathname;
    const cleanPath = rawPath === "/" ? "" : rawPath.replace(/\/+$/, "");
    const canonicalHref = `http://www.perfumecopy.com${cleanPath || "/"}`;

    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.setAttribute("rel", "canonical");
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute("href", canonicalHref);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", canonicalHref);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {/* Automatic Canonical tag and OG URL for live domain http://www.perfumecopy.com */}
          <CanonicalManager />
          {/* Scrolls window to top on every route change (must be inside Router, e.g. in index.js) */}
          <ScrollToTop />

          {/*
            Global header (shows login/avatar & cart).
            NOTE: Header.jsx already renders its OWN `.header-spacer` div
            internally, with height driven by the live `--header-height`
            CSS variable (kept in sync via ResizeObserver). Do NOT add a
            second spacer here — an extra one used to double the gap
            between the fixed header and page content, which is what was
            causing pages to render misaligned under/behind the header.
          */}
          <Header />

          {/* App routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/shop" element={<Navigate to="/collections/perfumes" replace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/find-your-scent" element={<FindYourScent />} />

            {/* Brand story page — Top/Heart/Base note structured About page */}
            <Route path="/about" element={<AboutPage />} />

            <Route path="/login" element={<Login />} />

            {/*
              Journal (blog) — public.
              "/journal/all" is declared explicitly (and before "/journal/:slug")
              for readability — React Router v6 would actually rank this static
              segment above the ":slug" param match regardless of declaration
              order, but keeping it above avoids any confusion for the next
              person reading this file, and avoids "all" ever being treated as
              a post slug.
            */}
            <Route path="/journal" element={<BlogList />} />
            <Route path="/journal/all" element={<BlogList />} />
            <Route path="/journal/:slug" element={<BlogPost />} />

            {/*
              Category listing pages (Men/Women/Unisex full product grid).
              NOTE: deliberately given its own path segment, "/collections/:category",
              instead of reusing "/shop/:slug" below. "/shop/:slug" is already
              claimed by InfoPage for the footer's Men/Women/Unisex/Gift Sets/
              Luxury Collection links — those two patterns are identical in
              specificity, so React Router can only ever match one of them per
              URL. Keeping this on its own segment avoids that collision entirely.
            */}
            <Route path="/collections/:category" element={<CategoryPage />} />

            {/* Footer info pages: Men/Women/Unisex/Gift Sets/Luxury Collection */}
            <Route path="/shop/:slug" element={<InfoPage group="shop" />} />

            {/* Footer info pages: About/Our Story/Blog/Support/Contact/Terms */}
            <Route path="/company/:slug" element={<InfoPage group="company" />} />

            {/* Footer info pages: Privacy/Delivery & Returns/Shipping policies */}
            <Route path="/policies/:slug" element={<InfoPage group="policies" />} />

            {/* User pages */}
            <Route path="/orders" element={OrdersPage ? <OrdersPage /> : <div />} />

            {/*
              Single order tracking page — shows live Shiprocket delivery
              status for one order. Protected, since order data is
              user-specific. Reads :orderId from the URL via useParams()
              inside OrderStatus.jsx.
            */}
            <Route
              path="/orders/:orderId"
              element={
                <PrivateRoute>
                  <OrderStatus />
                </PrivateRoute>
              }
            />

            {/*
              Journal (blog) — admin, protected.
              NOTE: these are declared as explicit paths (not part of the
              /admin/* wildcard below) because AdminPanel owns everything
              under /admin/* itself. React Router v6 ranks explicit paths
              like "/admin/journal" as more specific than a wildcard match,
              so these will always win over /admin/* regardless of the
              order routes are declared in — no need to move anything above
              the wildcard route below.
            */}
            <Route
              path="/admin/journal"
              element={
                <PrivateRoute>
                  <BlogAdminList />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/journal/new"
              element={
                <PrivateRoute>
                  <BlogEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/journal/:id/edit"
              element={
                <PrivateRoute>
                  <BlogEditor />
                </PrivateRoute>
              }
            />

            {/* Admin area (protected) */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute>
                  <AdminPanel />
                </PrivateRoute>
              }
            />

            {/* Protected checkout and confirmation routes */}
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <PrivateRoute>
                  <OrderConfirmation />
                </PrivateRoute>
              }
            />

            {/* Fallbacks / add other routes as needed */}
          </Routes>

          {/* Mini cart overlay mounted at the app root */}
          <MiniCart />
          <TrustBadges />
          <Footer />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
