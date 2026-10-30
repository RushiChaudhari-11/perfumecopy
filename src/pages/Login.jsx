// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SEO from "../components/SEO";
import "../styles/login.css";

/**
 * Luxury "Signature" Perfume Atelier Login & Registration Page
 * - Supports Email/Password Sign In & Sign Up
 * - Supports Google Popup Sign-in
 * - Supports Forgot Password / Password Reset Link
 * - Password Show/Hide Toggle
 * - 4K Luxury Perfume Stage Background with Ruby Bottle preserved
 */
export default function Login() {
  const { signInWithEmail, signInWithGoogle, signupWithEmail, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || "/";

  const [mode, setMode] = useState("login"); // 'login' | 'signup' | 'forgot'
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function updateField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
    setSuccessMsg("");
  }

  // Email & Password Auth Handler
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (mode === "signup") {
        if (!form.name.trim()) throw new Error("Please enter your full name.");
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signupWithEmail(form.email.trim(), form.password, form.name.trim());
      } else if (mode === "login") {
        await signInWithEmail(form.email.trim(), form.password);
      } else if (mode === "forgot") {
        if (!form.email.trim()) throw new Error("Please enter your registered email address.");
        await sendPasswordReset(form.email.trim());
        setSuccessMsg("A password recovery link has been dispatched to your email inbox.");
        setLoading(false);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // Google Popup Sign In Handler
  async function onGoogle() {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in was canceled or failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="luxury-login-page"
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL || ""}/login-luxury-bg.jpg")`,
      }}
    >
      <SEO
        title="Client Access & Sign In | Perfume Copy"
        description="Sign in or register for privileged access to curated luxury perfumes, order tracking, and bespoke fragrance services at Perfume Copy."
        url="http://www.perfumecopy.com/login"
      />
      <div className="luxury-login-card">
        {/* ─── Left Column: Luxury Brand Welcome Panel ─── */}
        <div className="luxury-login-brand-panel">
          <div className="brand-panel-top">
            <div className="brand-panel-eyebrow">
              ✦ SIGNATURE ATELIER ✦
            </div>
            <div className="brand-panel-script">Signature.</div>
            <h1 className="brand-panel-title">
              {mode === "signup"
                ? "Bespoke Membership"
                : mode === "forgot"
                ? "Account Recovery"
                : "Privileged Access"}
            </h1>
            <p className="brand-panel-desc">
              Enter our private olfactory sanctuary to curate your bespoke fragrances, track white-glove deliveries, and enjoy private extrait releases.
            </p>

            <div className="brand-perks-list">
              <div className="brand-perk-item">
                <span className="brand-perk-bullet">✦</span>
                <span>Complimentary 2ml extrait sample with every curated order</span>
              </div>
              <div className="brand-perk-item">
                <span className="brand-perk-bullet">✦</span>
                <span>Priority concierge & expedited dispatch tracking</span>
              </div>
              <div className="brand-perk-item">
                <span className="brand-perk-bullet">✦</span>
                <span>Exclusive private access to rare seasonal reserves</span>
              </div>
            </div>
          </div>

          <div className="brand-panel-bottom">
            <svg
              className="brand-shield-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>256-Bit SSL Encrypted & Authenticated Atelier</span>
          </div>
        </div>

        {/* ─── Right Column: Authentication Form Panel ─── */}
        <div className="luxury-login-form-panel">
          {/* Mobile Brand Header (shown only on mobile/tablet screens <= 768px) */}
          <div className="luxury-mobile-brand-header">
            <div className="brand-panel-eyebrow">✦ SIGNATURE ATELIER ✦</div>
            <div className="brand-panel-script">Signature.</div>
            <div className="brand-panel-title">
              {mode === "signup"
                ? "Bespoke Membership"
                : mode === "forgot"
                ? "Account Recovery"
                : "Privileged Access"}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== "forgot" ? (
            <div className="luxury-auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`luxury-auth-tab-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={`luxury-auth-tab-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="luxury-auth-tabs">
              <button
                type="button"
                className="luxury-auth-tab-btn active"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Google Sign In Button */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                className="luxury-google-btn"
                onClick={onGoogle}
                disabled={loading}
                aria-label="Continue with Google"
              >
                <svg className="luxury-google-icon" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.5-34.2-4.3-50.5H272v95.6h147.1c-6.3 34-25.3 62.9-54 82.1v68.2h87.2c51-47 80.2-116.1 80.2-195.4z"/>
                  <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.1l-87.2-68.2c-24.2 16.2-55.5 25.9-93.6 25.9-71.9 0-132.8-48.5-154.6-113.7H28.9v71.4C73.9 483.7 166 544.3 272 544.3z"/>
                  <path fill="#FBBC05" d="M117.4 324.2c-10.8-32.7-10.8-67.9 0-100.6V152.2H28.9c-40.1 79.6-40.1 173.5 0 253.1l88.5-81.1z"/>
                  <path fill="#EA4335" d="M272 109.9c39.9-.6 78.5 14.6 107.8 41.9l80.8-80.8C407 26.5 344.9 0 272 0 166 0 73.9 60.6 28.9 152.2l88.5 71.4C139.2 158.4 200.1 109.9 272 109.9z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="luxury-form-divider">
                <span>or continue with email</span>
              </div>
            </>
          )}

          {/* Authentication Form */}
          <form onSubmit={onSubmit} className="luxury-form-fields" noValidate>
            {/* Full Name for Signup */}
            {mode === "signup" && (
              <div className="luxury-field-group">
                <label className="luxury-field-label" htmlFor="user-name">
                  Full Name
                </label>
                <div className="luxury-input-wrap">
                  <input
                    id="user-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Lady Vivienne"
                    autoComplete="name"
                    required
                    className="luxury-input"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="luxury-field-group">
              <label className="luxury-field-label" htmlFor="user-email">
                Email Address
              </label>
              <div className="luxury-input-wrap">
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="connoisseur@signature.com"
                  autoComplete="email"
                  required
                  className="luxury-input"
                />
              </div>
            </div>

            {/* Password Field (only for login & signup) */}
            {mode !== "forgot" && (
              <div className="luxury-field-group">
                <div className="luxury-field-label-row">
                  <label className="luxury-field-label" htmlFor="user-password">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="luxury-forgot-btn"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setSuccessMsg("");
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="luxury-input-wrap">
                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={6}
                    className="luxury-input"
                  />
                  <button
                    type="button"
                    className="luxury-pwd-toggle-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      /* Eye Off Icon */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      /* Eye Icon */
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="luxury-alert error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="luxury-alert success" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              className="luxury-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Authenticating…"
                : mode === "signup"
                ? "Create Account"
                : mode === "forgot"
                ? "Send Reset Link"
                : "Sign In"}
            </button>
          </form>

          {/* Terms & Privacy Note */}
          <div className="luxury-form-footer-note">
            By proceeding, you agree to Signature's{" "}
            <Link to="/terms">Terms of Service</Link> and{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </main>
  );
}
