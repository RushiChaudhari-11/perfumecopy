import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaStore,
} from "react-icons/fa";
import "../styles/Footer.css";

// Same logo used in the header — keep this in sync with LOGO_SRC / BRAND_NAME
// in Header.jsx if either ever changes.
const LOGO_SRC = "/logo.png";
const BRAND_NAME = "Perfume Copy";

// Update with your real social pages.
const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/maisonparfum",
  instagram: "https://www.instagram.com/maisonparfum",
};

// Update with your real store/contact details.
const CONTACT_INFO = {
  address: "Shop No 201, Xion Mall, Hinjewadi, Pune-411057",
  phone: "+91 78978 97441",
  phoneHref: "+917897897441",
  email: "perfumecopy@gmail.com",
  wholesalePhone: "+91 78978 97441",
  wholesalePhoneHref: "+917897897441",
};

const Footer = () => {
  return (
    <footer className="footer-min">
      <div className="footer-min-inner">

        {/* Brand — logo image only. BRAND_NAME is still used for the
            image's alt text (accessibility/SEO), just not shown visibly
            anymore, matching the header. */}
        <div className="footer-brand">
          <img src={LOGO_SRC} alt={BRAND_NAME} className="footer-logo-img" />
        </div>

        <div className="footer-min-container">

          {/* Support */}
          <div className="footer-min-col">
            <h3>Support</h3>

            {/* "About Us" removed — the dedicated brand story page now
                lives at /about and is linked directly from the header
                nav, so it no longer needs a footer entry here. */}
            <Link to="/company/faqs">FAQs</Link>
            <Link to="/company/fragrance-guide">Size / Fragrance Guide</Link>
            <Link to="/company/terms-services">Terms &amp; Services</Link>
          </div>

          {/* Contact Us */}
          <div className="footer-min-col">
            <h3>Contact Us</h3>

            <div className="footer-min-contact">
              <p className="footer-min-contact-line">
                <FaMapMarkerAlt className="footer-min-contact-icon" />
                <span>{CONTACT_INFO.address}</span>
              </p>

              <p className="footer-min-contact-line">
                <FaPhoneAlt className="footer-min-contact-icon" />
                <a href={`tel:${CONTACT_INFO.phoneHref}`}>{CONTACT_INFO.phone}</a>
              </p>

              <p className="footer-min-contact-line">
                <FaEnvelope className="footer-min-contact-icon" />
                <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
              </p>

              <p className="footer-min-contact-line">
                <FaStore className="footer-min-contact-icon" />
                <span>
                  For Wholesale Contact On{" "}
                  <a href={`tel:${CONTACT_INFO.wholesalePhoneHref}`}>
                    {CONTACT_INFO.wholesalePhone}
                  </a>
                </span>
              </p>
            </div>

            <div className="footer-min-social">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Maison Parfum on Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Maison Parfum on Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Orders and Shipping */}
          <div className="footer-min-col">
            <h3>Orders and Shipping</h3>

            <Link to="/policies/privacy-policy">Privacy Policy</Link>
            <Link to="/policies/delivery-returns-policy">Delivery &amp; Returns Policy</Link>
            <Link to="/policies/shipping-policy">Shipping Policy</Link>
            <Link to="/orders">Track My Order</Link>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
