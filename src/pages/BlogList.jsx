// src/pages/BlogList.jsx
//
// Public-facing blog index — "The Journal". Route: /journal
// Rename the label/route anywhere you like; the component doesn't care.
//
// NOTE: Swiper carousel removed — the "Featured" section is now a simple
// static grid (first FEATURED_COUNT posts). Clicking "View All Entries"
// reveals the full tag-filterable, paginated journal grid below, same as
// before.
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import GridPagination from "../components/Pagination";
import { fetchPublishedPosts } from "../services/blogService";
import "../styles/blog.css";

const SITE_URL = "http://www.perfumecopy.com";
const SITE_NAME = "Perfume Copy";
const FEATURED_COUNT = 4; // how many of the loaded posts appear in the featured grid

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // showAll is now derived from the route, not local state:
  // /journal            -> featured grid only
  // /journal/all        -> full tag-filterable grid
  const location = useLocation();
  const navigate = useNavigate();
  const showAll = location.pathname.replace(/\/+$/, "").endsWith("/all");

  const gridRef = useRef(null);

  // Applies the light "journal-bg" gradient to <body> only while this
  // page is mounted, and removes it on unmount. Scoped by class name so
  // it can never leak onto any other route — styles.css's global dark
  // background (html, body, #root { background-color: var(--bg) }) is
  // untouched everywhere else on the site.
  useEffect(() => {
    document.body.classList.add("journal-bg");
    return () => document.body.classList.remove("journal-bg");
  }, []);

  const loadFirstPage = useCallback(async (tag) => {
    setLoading(true);
    setError(null);
    try {
      const { posts: firstPage, lastDoc: cursor, hasMore: more } = await fetchPublishedPosts({
        pageSize: 9,
        tag,
      });
      setPosts(firstPage);
      setLastDoc(cursor);
      setHasMore(more);
    } catch (err) {
      console.error("Failed to load journal posts:", err);
      setError("The journal couldn't be loaded right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirstPage(activeTag);
  }, [activeTag, loadFirstPage]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { posts: nextPage, lastDoc: cursor, hasMore: more } = await fetchPublishedPosts({
        pageSize: 9,
        cursor: lastDoc,
        tag: activeTag,
      });
      setPosts((prev) => [...prev, ...nextPage]);
      setLastDoc(cursor);
      setHasMore(more);
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const allTags = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  // First N loaded posts power the featured grid. No extra Firestore
  // query needed — it reuses the same page of posts already fetched for
  // the main grid below.
  const featuredPosts = useMemo(() => posts.slice(0, FEATURED_COUNT), [posts]);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `${SITE_NAME} Journal`,
      url: `${SITE_URL}/journal`,
      description:
        "Notes on fragrance, craft, and the world behind Aura's collections.",
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE_URL}/journal/${p.slug}`,
        image: p.coverImage,
      })),
    }),
    [posts]
  );

  // Navigates to the dedicated "/journal/all" page instead of expanding
  // in place. Swap this for a plain <Link to="/journal/all"> on the
  // button below if you don't need the programmatic navigate() call
  // anywhere else.
  const handleViewAll = () => {
    navigate("/journal/all");
  };

  useEffect(() => {
    if (showAll) {
      // Wait a tick for the grid section to actually render, then scroll to it.
      requestAnimationFrame(() => {
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [showAll]);

  return (
    <main className="journal-page">
      <SEO
        title={`Journal — ${SITE_NAME} | Fragrance Notes & Stories`}
        description="Notes on fragrance, craft, and the world behind Perfume Copy's collections — from raw materials to the art of the pour."
        url={`${SITE_URL}/journal`}
        image={`${SITE_URL}/og/journal-cover.jpg`}
        type="website"
        jsonLd={jsonLd}
      />

      <header className="journal-hero">
        <p className="journal-eyebrow">The House Journal</p>
        <h1 className="journal-title">Notes &amp; Reflections</h1>
        <p className="journal-subtitle">
          Stories from the atelier — on materials, memory, and the making of scent.
        </p>
      </header>

      {/* ── Tag filter nav — pinned to the top of the /journal/all page ── */}
      {showAll && allTags.length > 0 && (
        <nav className="journal-tags" aria-label="Filter by topic">
          <button
            className={`journal-tag${!activeTag ? " active" : ""}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`journal-tag${activeTag === tag ? " active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </nav>
      )}

      {/* ── Featured grid (static, no carousel) — only on /journal ──── */}
      {!showAll && !loading && featuredPosts.length > 0 && (
        <section className="journal-featured" aria-label="Featured entries">
          <div className="journal-featured-grid">
            {featuredPosts.map((post) => (
              <Link to={`/journal/${post.slug}`} className="journal-slide-card" key={post.id}>
                <div className="journal-slide-media">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} loading="lazy" />
                  ) : (
                    <div className="journal-card-media-fallback" aria-hidden="true" />
                  )}
                </div>
                <div className="journal-slide-body">
                  <div className="journal-card-meta">
                    <time dateTime={post.publishedAt?.toDate?.().toISOString()}>
                      {formatDate(post.publishedAt)}
                    </time>
                    {post.readTimeMinutes && (
                      <>
                        <span className="journal-dot" aria-hidden="true">
                          ·
                        </span>
                        <span>{post.readTimeMinutes} min read</span>
                      </>
                    )}
                  </div>
                  <h2 className="journal-slide-title">{post.title}</h2>
                  <p className="journal-slide-excerpt">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          {!showAll && (
            <div className="journal-view-all-wrap">
              <button type="button" className="journal-view-all-btn" onClick={handleViewAll}>
                View All Entries
              </button>
            </div>
          )}
        </section>
      )}

      {showAll && (
        <>
          {error && <p className="journal-error">{error}</p>}

          {loading ? (
            <div className="journal-grid" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="journal-card journal-card-skeleton" key={i} aria-hidden="true" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="journal-empty">
              <p>No entries yet{activeTag ? ` under “${activeTag}”` : ""}. Check back soon.</p>
            </div>
          ) : (
            <>
              <div className="journal-grid" ref={gridRef}>
                {posts.map((post) => (
                  <article className="journal-card" key={post.id}>
                    <Link to={`/journal/${post.slug}`} className="journal-card-link">
                      <div className="journal-card-media">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt={post.title} loading="lazy" />
                        ) : (
                          <div className="journal-card-media-fallback" aria-hidden="true" />
                        )}
                      </div>
                      <div className="journal-card-body">
                        <div className="journal-card-meta">
                          <time dateTime={post.publishedAt?.toDate?.().toISOString()}>
                            {formatDate(post.publishedAt)}
                          </time>
                          {post.readTimeMinutes && (
                            <>
                              <span className="journal-dot" aria-hidden="true">
                                ·
                              </span>
                              <span>{post.readTimeMinutes} min read</span>
                            </>
                          )}
                        </div>
                        <h2 className="journal-card-title">{post.title}</h2>
                        <p className="journal-card-excerpt">{post.excerpt}</p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              <GridPagination
                hasMore={hasMore}
                loading={loadingMore}
                onLoadMore={loadMore}
                label="Load more entries"
                doneLabel={posts.length > 0 ? "You've reached the end of the journal." : null}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
