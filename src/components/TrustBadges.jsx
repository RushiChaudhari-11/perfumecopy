import "../styles/TrustBadges.css";

const BADGES = [
  {
    id: "shipping",
    title: "Free Shipping",
    text: "Free shipping on orders above ₹599 across India",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 14h20v16H6z M26 20h8l6 6v4h-14z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="34" r="3.2" stroke="currentColor" strokeWidth="2" />
        <circle cx="33" cy="34" r="3.2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "returns",
    title: "Easy Returns",
    text: "Simple return process with the perfumes",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 24a10 10 0 1 1 3 7.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M17 34l0 -4 -4 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "payment",
    title: "Secure Payment",
    text: "Your payment information is processed through a secure payment gateway",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 6l14 5v10c0 9-6 16-14 21-8-5-14-12-14-21V11z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M18 24l4.5 4.5L31 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function TrustBadges() {
  return (
    <section className="tb-section" aria-label="Shopping assurances">
      <ul className="tb-grid">
        {BADGES.map((badge) => (
          <li className="tb-card" key={badge.id}>
            <span className="tb-icon">{badge.icon}</span>
            <div className="tb-copy">
              <h3 className="tb-title">
                {badge.title}
                <span className="tb-underline" aria-hidden="true" />
              </h3>
              <p className="tb-text">{badge.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
