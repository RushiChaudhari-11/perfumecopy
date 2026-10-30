// src/components/SEO.jsx
//
// Lightweight SEO head manager — no react-helmet dependency required.
// Sets document.title, standard + Open Graph + Twitter meta tags, a
// canonical link, and an optional JSON-LD script block. Cleans up after
// itself on unmount so navigating between pages never leaves stale tags.
import { useEffect } from "react";

export const BASE_SITE_URL = "http://www.perfumecopy.com";

function normalizeUrl(url) {
  if (!url) {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      return `${BASE_SITE_URL}${p === "/" ? "" : p}`;
    }
    return BASE_SITE_URL;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${BASE_SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizeImage(img) {
  if (!img) return `${BASE_SITE_URL}/logo.png`;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_SITE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
}

function upsertMeta(attr, key, content) {
  if (content == null) return null;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return { el, created };
}

function upsertCanonical(url) {
  if (!url) return null;
  let el = document.head.querySelector('link[rel="canonical"]');
  const created = !el;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
  return { el, created };
}

/**
 * @param {object} props
 * @param {string} props.title            Page <title> and og:title / twitter:title
 * @param {string} props.description      meta description and social descriptions
 * @param {string} [props.image]           absolute URL for social preview image
 * @param {string} [props.url]             canonical URL for this page
 * @param {"website"|"article"} [props.type]
 * @param {object} [props.jsonLd]          plain object, serialized to a JSON-LD <script>
 */
export default function SEO({ title, description, image, url, type = "website", jsonLd }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    const canonicalUrl = normalizeUrl(url);
    const socialImage = normalizeImage(image);

    const created = [];

    const desc = upsertMeta("name", "description", description);
    if (desc) created.push(desc);

    created.push(upsertMeta("property", "og:title", title));
    created.push(upsertMeta("property", "og:description", description));
    created.push(upsertMeta("property", "og:type", type));
    created.push(upsertMeta("property", "og:url", canonicalUrl));
    created.push(upsertMeta("property", "og:image", socialImage));

    created.push(upsertMeta("name", "twitter:card", socialImage ? "summary_large_image" : "summary"));
    created.push(upsertMeta("name", "twitter:title", title));
    created.push(upsertMeta("name", "twitter:description", description));
    created.push(upsertMeta("name", "twitter:image", socialImage));

    const canonical = upsertCanonical(canonicalUrl);

    let script = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      // Only remove tags this instance actually created, so we don't fight
      // with another SEO instance mounted elsewhere (rare, but cheap to guard).
      created.forEach((entry) => {
        if (entry?.created && entry.el?.parentNode) entry.el.parentNode.removeChild(entry.el);
      });
      if (canonical?.created && canonical.el?.parentNode) {
        canonical.el.parentNode.removeChild(canonical.el);
      }
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, url, type, jsonLd]);

  return null;
}
