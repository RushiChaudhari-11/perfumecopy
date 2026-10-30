import React from "react";
import "./AnnouncementTicker.css";

const TICKER_ITEMS = [
  { text: "GET 10% OFF ON YOUR FIRST ORDER ABOVE ₹599. USE CODE", highlight: "WELCOME10 🔥" },
  { text: "ADDITIONAL 5% OFF ON PREPAID ORDERS", highlight: "" },
  { text: "FREE LUXURY SAMPLE WITH EVERY PURCHASE", highlight: "GIFT 🎁" },
  { text: "COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹999", highlight: "" },
  { text: "CRAFTED WITH FRENCH ESSENTIAL OILS & LONG-LASTING EXTRAIT", highlight: "PURE LUXE ✨" },
];

export default function AnnouncementTicker() {
  // Duplicate array to ensure seamless infinite looping with no jump
  const loopList = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="announcement-ticker-bar" aria-label="Special Offers and Announcements">
      <div className="announcement-ticker-track">
        {loopList.map((item, idx) => (
          <div key={idx} className="announcement-ticker-item">
            <span className="ticker-sparkle">✦</span>
            <span className="ticker-text">
              {item.text}
              {item.highlight && <strong className="ticker-code"> {item.highlight}</strong>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

