// Central content store for every page reachable from the footer's
// "Shop" and "Company" columns. Add/edit entries here — InfoPage.jsx
// renders whatever it finds under the matching slug.

const footerPagesData = {
  shop: {
    "men-perfumes": {
      eyebrow: "Shop / Men",
      title: "Men Perfumes",
      tagline: "Bold, grounded, unmistakably yours.",
      hero:
        "Woody, leathered and spiced compositions built for presence — from the boardroom to the last hour of the night.",
      sections: [
        {
          heading: "What defines the collection",
          body:
            "Each fragrance opens with citrus or spice, settles into a heart of leather, cedar or tobacco, and closes on a warm amber or vetiver base that lingers for hours without overwhelming a room.",
        },
        {
          heading: "Signature notes",
          list: ["Cedarwood & Vetiver", "Black Pepper & Bergamot", "Leather & Tobacco Leaf", "Oud & Amber"],
        },
        {
          heading: "Best for",
          body:
            "Daily wear, formal occasions and evening events alike — the line is built around longevity (8–10 hours) and moderate sillage so it reads confident, not loud.",
        },
      ],
      cta: "Browse Men's Fragrances",
    },
    "women-perfumes": {
      eyebrow: "Shop / Women",
      title: "Women Perfumes",
      tagline: "Florals, fruits and a quiet kind of power.",
      hero:
        "From soft white florals to bold gourmands, every bottle is composed to evolve through the day — light at sunrise, rich by candlelight.",
      sections: [
        {
          heading: "What defines the collection",
          body:
            "Top notes of citrus, pear or pink pepper give way to floral hearts — rose, jasmine, peony — resting on bases of musk, vanilla or sandalwood for a finish that feels personal rather than perfumed.",
        },
        {
          heading: "Signature notes",
          list: ["Rose & Peony", "Jasmine Sambac", "Vanilla & Musk", "Citrus & Pink Pepper"],
        },
        {
          heading: "Best for",
          body:
            "Office to evening transitions, gifting, and anyone who prefers a fragrance that's noticed only when someone leans in close.",
        },
      ],
      cta: "Browse Women's Fragrances",
    },
    unisex: {
      eyebrow: "Shop / Unisex",
      title: "Unisex",
      tagline: "Scent without a gender, built for the wearer alone.",
      hero:
        "A curated line of abstract, mineral and botanical compositions designed to be worn by anyone who recognises themselves in them.",
      sections: [
        {
          heading: "What defines the collection",
          body:
            "These fragrances skip traditional florals-vs-woods conventions entirely, leaning into salt, paper, incense and green tea accords that feel modern and minimal.",
        },
        {
          heading: "Signature notes",
          list: ["Sea Salt & Ambergris", "Green Tea & Fig", "Incense & Cedar", "White Musk"],
        },
        {
          heading: "Best for",
          body: "Layering, minimalists, and anyone building a single signature scent for every occasion.",
        },
      ],
      cta: "Browse Unisex Fragrances",
    },
    "gift-sets": {
      eyebrow: "Shop / Gift Sets",
      title: "Gift Sets",
      tagline: "Thoughtfully paired, beautifully boxed.",
      hero:
        "Curated duos and discovery sets — full-size signatures alongside travel formats, presented in our signature matte-black gift box.",
      sections: [
        {
          heading: "What's inside",
          body:
            "Most sets pair one full-size 50ml bottle with a 10ml travel atomiser of a complementary scent, plus a satin pouch and a hand-written note card slot.",
        },
        {
          heading: "Popular pairings",
          list: ["Discovery Set — 5 x 10ml", "Signature Duo — His & Hers", "Travel Trio — 3 x 15ml", "Anniversary Edition Box"],
        },
        {
          heading: "Best for",
          body: "Anniversaries, weddings, corporate gifting, and first-time fragrance buyers who want to sample before committing.",
        },
      ],
      cta: "Browse Gift Sets",
    },
    "luxury-collection": {
      eyebrow: "Shop / Luxury Collection",
      title: "Luxury Collection",
      tagline: "Rare materials. Limited batches. No compromises.",
      hero:
        "Our most exclusive line — small-batch extraits de parfum using rare oud, orris root and natural ambergris, numbered and individually hand-finished.",
      sections: [
        {
          heading: "What defines the collection",
          body:
            "Concentrations of 30%+ pure perfume oil, aged for a minimum of six months before bottling, in hand-blown glass with 24k gold-plated caps.",
        },
        {
          heading: "Signature notes",
          list: ["Royal Oud", "Orris & Iris Root", "Natural Ambergris", "Saffron & Rose Absolute"],
        },
        {
          heading: "Best for",
          body: "Collectors, special occasions, and anyone seeking a fragrance that no one else in the room is wearing.",
        },
      ],
      cta: "Browse Luxury Collection",
    },
  },
  company: {
    about: {
      eyebrow: "Company / About",
      title: "About Maison Parfum",
      tagline: "Founded on one belief: scent is memory you can wear.",
      hero:
        "Maison Parfum was built by perfumers and storytellers who believe fragrance should feel personal, not mass-produced — every formula is composed in small batches and tested for at least 90 days before release.",
      sections: [
        {
          heading: "Our craft",
          body:
            "We work directly with growers in Grasse, Mysore and Socotra for raw materials, blending traditional perfumery techniques with modern, skin-safe formulations.",
        },
        {
          heading: "Our values",
          list: ["Cruelty-free, always", "Small-batch production", "Transparent ingredient sourcing", "Refillable bottle program"],
        },
      ],
      cta: "Explore Our Collections",
    },
    "our-story": {
      eyebrow: "Company / Our Story",
      title: "Our Story",
      tagline: "From a single candle-lit workshop to a house of fragrance.",
      hero:
        "Maison Parfum began in 2016 as a one-room workshop where our founder hand-mixed the first three scents that would become the brand's signature trio.",
      sections: [
        {
          heading: "How we started",
          body:
            "What began as gifts for friends turned into word-of-mouth orders, then a waitlist, then a studio. We've kept the same hands-on approach to formulation ever since — every new scent is still nosed and approved in-house before it goes into production.",
        },
        {
          heading: "Milestones",
          list: ["2016 — First three signature scents created", "2019 — Opened our Grasse sourcing partnership", "2022 — Launched the Luxury Collection", "2025 — Introduced the refillable bottle program"],
        },
      ],
      cta: "Read Our Latest Journal Entries",
    },
    blog: {
      eyebrow: "Company / Blog",
      title: "The Journal",
      tagline: "Notes on scent, craft and the stories behind each bottle.",
      hero:
        "A running collection of essays on fragrance families, perfumer interviews, and behind-the-scenes looks at how each Maison Parfum scent comes together.",
      sections: [
        {
          heading: "Recent topics",
          list: [
            "How to layer fragrances without overpowering either one",
            "Inside Grasse: a week with our jasmine growers",
            "Why concentration (EDT vs EDP vs Extrait) actually matters",
            "The making of our Luxury Collection's Royal Oud",
          ],
        },
        {
          heading: "Why we write it",
          body:
            "Fragrance is hard to describe in a product listing — the Journal is where we go deeper into the materials, the people, and the process behind every release.",
        },
      ],
      cta: "Read the Journal",
    },
    support: {
      eyebrow: "Company / Support",
      title: "Support",
      tagline: "Real answers, from people who know the bottles by hand.",
      hero:
        "Questions about an order, a scent recommendation, or how to care for your fragrance — our support team typically responds within one business day.",
      sections: [
        {
          heading: "Common topics",
          list: ["Order tracking & shipping times", "Returns & exchanges (30-day window)", "Fragrance recommendations & layering advice", "Refill program & bottle care"],
        },
        {
          heading: "Get in touch",
          body:
            "Email us at support@maisonparfum.com or use live chat, available daily from 9am–7pm IST. For urgent order issues, include your order number for the fastest response.",
        },
      ],
      cta: "Contact Support",
    },
    // NEW — linked from the footer's Support column, added after the
    // /about page moved to its own dedicated route (AboutPage.jsx at
    // /about) instead of routing through InfoPage.
    faqs: {
      eyebrow: "Support",
      title: "Frequently Asked Questions",
      tagline: "Everything you're wondering, answered.",
      hero:
        "New to Perfume Copy or just curious how things work? Here are quick answers to the questions we hear most.",
      sections: [
        {
          heading: "Ordering & Payment",
          list: [
            "We accept UPI, credit/debit cards, and net banking at checkout.",
            "Once placed, orders can be edited or cancelled within 1 hour — contact us right away.",
            "You'll get an order confirmation by email as soon as payment goes through.",
          ],
        },
        {
          heading: "Shipping & Delivery",
          list: [
            "Orders are dispatched within 1–2 business days.",
            "Delivery typically takes 3–6 business days depending on your location.",
            "Track your order anytime from the 'Track My Order' link in the footer.",
          ],
        },
        {
          heading: "Product & Fragrance",
          body:
            "Every bottle is filled fresh in small batches. If a scent doesn't feel right for you, check our Return & Exchange policy — we want you to love what you wear.",
        },
      ],
      cta: "Back to Home",
    },
    "fragrance-guide": {
      eyebrow: "Guide",
      title: "Find Your Fragrance Fit",
      tagline: "A quick guide to notes, strength, and longevity.",
      hero:
        "Fragrance shopping can feel overwhelming. Here's a simple breakdown to help you choose a scent that actually suits you.",
      sections: [
        {
          heading: "Understanding Notes",
          list: [
            "Top notes — the first impression, fades within 15–30 minutes.",
            "Heart notes — the core character, lasts a few hours.",
            "Base notes — the lasting trail, can linger for 6+ hours.",
          ],
        },
        {
          heading: "Choosing Your Strength",
          body:
            "Eau de Parfum (EDP) offers richer, longer-lasting wear, ideal for evenings. Eau de Toilette (EDT) is lighter and better suited for daytime or warmer weather.",
        },
        {
          heading: "How to Apply",
          list: [
            "Spray on pulse points — wrists, neck, behind the ears.",
            "Don't rub your wrists together — it breaks down the top notes.",
            "Apply on moisturised skin for better longevity.",
          ],
        },
      ],
      cta: "Explore the Collection",
    },
    "terms-services": {
      eyebrow: "Company / Terms & Services",
      title: "Terms & Services",
      tagline: "The fine print, in plain language.",
      hero:
        "By using Maison Parfum's website and placing an order, you agree to the terms below. We've kept them as short and clear as legally possible.",
      sections: [
        {
          heading: "Using our site",
          body:
            "You must be 18 or older to place an order. Prices are listed in INR and include applicable taxes unless stated otherwise at checkout.",
        },
        {
          heading: "Orders & payment",
          list: [
            "Orders are confirmed once payment is successfully processed",
            "We reserve the right to cancel orders due to stock or pricing errors",
            "All payments are processed through secure, encrypted gateways",
          ],
        },
        {
          heading: "Intellectual property",
          body:
            "All product names, formulas, photography and site content are the property of Maison Parfum and may not be reproduced without permission.",
        },
      ],
      cta: "Back to Home",
    },
    contact: {
      eyebrow: "Company / Contact",
      title: "Contact Us",
      tagline: "We'd love to hear from you.",
      hero:
        "Whether it's a press inquiry, a wholesale request, or just a question about a scent — here's how to reach the right team.",
      sections: [
        {
          heading: "Reach us by department",
          list: [
            "General & Support — support@maisonparfum.com",
            "Press & Media — press@maisonparfum.com",
            "Wholesale & Partnerships — partnerships@maisonparfum.com",
            "Studio — 14 Rue des Fleurs, Grasse, France",
          ],
        },
        {
          heading: "Response time",
          body: "We aim to respond to all inquiries within 1–2 business days.",
        },
      ],
      cta: "Send Us a Message",
    },
  },
  policies: {
    "privacy-policy": {
      eyebrow: "Orders & Shipping / Privacy Policy",
      title: "Privacy Policy",
      tagline: "Your data, handled with the same care as our formulas.",
      hero:
        "We collect only what's needed to process your orders and improve your experience — never sold, never shared without consent.",
      sections: [
        {
          heading: "What we collect",
          list: ["Name, email & shipping address", "Order history & preferences", "Payment details (processed securely by our payment partner, never stored by us)"],
        },
        {
          heading: "How we use it",
          body:
            "To fulfil orders, send shipping updates, and — only if you've opted in — share news about new launches. You can unsubscribe at any time.",
        },
        {
          heading: "Your rights",
          body:
            "You can request a copy of your data or ask us to delete it at any time by contacting support@maisonparfum.com.",
        },
      ],
      cta: "Back to Home",
    },
    "delivery-returns-policy": {
      eyebrow: "Orders & Shipping / Delivery & Returns",
      title: "Delivery & Returns Policy",
      tagline: "Straightforward returns, no hidden conditions.",
      hero:
        "If a fragrance isn't right for you, we offer a 30-day return window on unopened products, and a 7-day exchange window on opened ones.",
      sections: [
        {
          heading: "Returns",
          list: [
            "Unopened products: full refund within 30 days",
            "Opened products: exchange only, within 7 days",
            "Gift sets must be returned complete with all original packaging",
          ],
        },
        {
          heading: "How to start a return",
          body:
            "Email support@maisonparfum.com with your order number — we'll send a prepaid return label and process your refund within 5 business days of receiving the item.",
        },
      ],
      cta: "Back to Home",
    },
    "shipping-policy": {
      eyebrow: "Orders & Shipping / Shipping Policy",
      title: "Shipping Policy",
      tagline: "Carefully packed, reliably delivered.",
      hero:
        "All orders are shipped in protective, leak-proof packaging within 1–2 business days of purchase.",
      sections: [
        {
          heading: "Delivery times",
          list: ["Metro cities: 2–4 business days", "Other locations: 4–7 business days", "International: 7–14 business days"],
        },
        {
          heading: "Shipping costs",
          body: "Free shipping on orders over ₹2,000. A flat ₹99 shipping fee applies below that threshold.",
        },
        {
          heading: "Tracking",
          body:
            "You'll receive a tracking link by email and SMS as soon as your order ships — or check anytime from the Track My Order page.",
        },
      ],
      cta: "Back to Home",
    },
  },
};

export default footerPagesData;