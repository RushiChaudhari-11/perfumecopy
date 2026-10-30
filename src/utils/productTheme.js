// src/utils/productTheme.js
// Configurable Color Themes for Luxury Product Showcase

export const PRODUCT_THEMES = {
  ruby: {
    accent: "#7a1638",
    accentHover: "#931b46",
    subtleBg: "#fbf6f5",
    highlight: "#d97706",
    badgeBg: "#7a1638",
    saveBadgeBg: "#fdf2f4",
    saveBadgeColor: "#9f1239",
    glow: "rgba(122, 22, 56, 0.12)",
  },
  gold: {
    accent: "#8a5814",
    accentHover: "#a36a18",
    subtleBg: "#faf7f3",
    highlight: "#d97706",
    badgeBg: "#8a5814",
    saveBadgeBg: "#fffbeb",
    saveBadgeColor: "#b45309",
    glow: "rgba(138, 88, 20, 0.12)",
  },
  blue: {
    accent: "#0f3b68",
    accentHover: "#164d85",
    subtleBg: "#f4f7fa",
    highlight: "#d4a343",
    badgeBg: "#0f3b68",
    saveBadgeBg: "#eff6ff",
    saveBadgeColor: "#1e40af",
    glow: "rgba(15, 59, 104, 0.12)",
  },
  purple: {
    accent: "#5b2149",
    accentHover: "#732c5e",
    subtleBg: "#f9f5f8",
    highlight: "#e0a899",
    badgeBg: "#5b2149",
    saveBadgeBg: "#fdf4ff",
    saveBadgeColor: "#86198f",
    glow: "rgba(91, 33, 73, 0.12)",
  },
  amber: {
    accent: "#854d0e",
    accentHover: "#a16207",
    subtleBg: "#faf7f2",
    highlight: "#b45309",
    badgeBg: "#854d0e",
    saveBadgeBg: "#fefce8",
    saveBadgeColor: "#854d0e",
    glow: "rgba(133, 77, 14, 0.12)",
  },
  green: {
    accent: "#166534",
    accentHover: "#15803d",
    subtleBg: "#f4f7f4",
    highlight: "#ca8a04",
    badgeBg: "#166534",
    saveBadgeBg: "#f0fdf4",
    saveBadgeColor: "#166534",
    glow: "rgba(22, 101, 52, 0.12)",
  },
  dark: {
    accent: "#18181b",
    accentHover: "#27272a",
    subtleBg: "#f8f8f9",
    highlight: "#ca8a04",
    badgeBg: "#18181b",
    saveBadgeBg: "#f4f4f5",
    saveBadgeColor: "#27272a",
    glow: "rgba(24, 24, 27, 0.12)",
  },
};

// Dynamic theme resolver
export function resolveProductTheme(product) {
  if (!product) return PRODUCT_THEMES.ruby;
  if (product.theme && PRODUCT_THEMES[product.theme]) {
    return PRODUCT_THEMES[product.theme];
  }
  const text = `${product.name} ${product.category || ""} ${product.fragranceFamily || ""} ${product.notes || ""}`.toLowerCase();
  if (text.includes("scarlet") || text.includes("ruby") || text.includes("rose") || text.includes("red")) {
    return PRODUCT_THEMES.ruby;
  }
  if (text.includes("blue") || text.includes("ozone") || text.includes("grace") || text.includes("aquatic") || text.includes("marine")) {
    return PRODUCT_THEMES.blue;
  }
  if (text.includes("amethyst") || text.includes("purple") || text.includes("plum") || text.includes("iris") || text.includes("orchid")) {
    return PRODUCT_THEMES.purple;
  }
  if (text.includes("auric") || text.includes("fleur") || text.includes("solar") || text.includes("gold")) {
    return PRODUCT_THEMES.gold;
  }
  if (text.includes("amber") || text.includes("alp") || text.includes("cognac") || text.includes("caramel")) {
    return PRODUCT_THEMES.amber;
  }
  if (text.includes("metal") || text.includes("black") || text.includes("noir") || text.includes("dark")) {
    return PRODUCT_THEMES.dark;
  }
  if (text.includes("green") || text.includes("talc") || text.includes("sage") || text.includes("fresh")) {
    return PRODUCT_THEMES.green;
  }
  return PRODUCT_THEMES.ruby;
}

