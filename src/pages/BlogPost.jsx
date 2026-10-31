// src/pages/BlogPost.jsx
//
// Single journal entry. Route: /journal/:slug
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import SEO from "../components/SEO";
import {
  fetchPostBySlug,
  fetchRelatedPosts,
  incrementPostViews,
} from "../services/blogService";
import "../styles/blog.css";

const BLOG_POST_SITE_URL = "http://www.perfumecopy.com";
const BLOG_POST_SITE_NAME = "Perfume Copy";

function sanitizeHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "");
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Applies the light "journal-bg" gradient to <body> only while this
  // page is mounted, and removes it on unmount. Scoped by class name so
  // it can never leak onto any other route — styles.css's global dark
  // background (html, body, #root { background-color: var(--bg) }) is
  // untouched everywhere else on the site. Placed as its own effect
  // (independent of the slug-fetch effect below) so it runs regardless
  // of loading/notFound state and cleans up correctly on unmount.
  useEffect(() => {
    document.body.classList.add("journal-bg");
    return () => document.body.classList.remove("journal-bg");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setNotFound(false);

      try {
        const found = await fetchPostBySlug(slug);
        if (!isMounted) return;

        if (!found) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPost(found);
        incrementPostViews(found.id); // fire-and-forget
        setLoading(false);

        try {
          const relatedPosts = await fetchRelatedPosts(found, 3);
          if (isMounted) setRelated(relatedPosts);
        } catch (relatedErr) {
          console.error("Failed to load related posts:", relatedErr);
        }
      } catch (err) {
        console.error("Failed to load journal entry:", err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!post) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: post.coverImage,
      author: { "@type": "Person", name: post.author || BLOG_POST_SITE_NAME },
      publisher: { "@type": "Organization", name: BLOG_POST_SITE_NAME },
      datePublished: post.publishedAt?.toDate?.().toISOString(),
      dateModified: (post.updatedAt || post.publishedAt)?.toDate?.().toISOString(),
      mainEntityOfPage: `${BLOG_POST_SITE_URL}/journal/${post.slug}`,
    };
  }, [post]);

  if (loading) {
    return (
      <main className="journal-post journal-post-loading" aria-busy="true">
        <div className="journal-post-skeleton-hero" />
        <div className="journal-post-skeleton-line" />
        <div className="journal-post-skeleton-line short" />
      </main>
    );
  }

  if (notFound) {
    return <Navigate to="/journal" replace />;
  }

  return (
    <main className="journal-post">
      <SEO
        title={post.metaTitle || `${post.title} — ${BLOG_POST_SITE_NAME} Journal`}
        description={post.metaDescription || post.excerpt}
        url={`${BLOG_POST_SITE_URL}/journal/${post.slug}`}
        image={post.coverImage}
        type="article"
        jsonLd={jsonLd}
      />

      <nav className="journal-post-breadcrumb" aria-label="Breadcrumb">
        <Link to="/journal">Journal</Link>
        <span aria-hidden="true">/</span>
        <span>{post.title}</span>
      </nav>

      <header className="journal-post-header">
        {post.tags?.length > 0 && (
          <ul className="journal-post-tags" aria-label="Topics">
            {post.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
        <h1 className="journal-post-title">{post.title}</h1>
        <div className="journal-post-meta">
          <span>{post.author || BLOG_POST_SITE_NAME}</span>
          <span className="journal-dot" aria-hidden="true">
            ·
          </span>
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
      </header>

      {post.coverImage && (
        <figure className="journal-post-cover">
          <img src={post.coverImage} alt={post.title} />
        </figure>
      )}

      <article
        className="journal-post-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
      />

      {related.length > 0 && (
        <section className="journal-related" aria-label="Related entries">
          <h2>More from the Journal</h2>
          <div className="journal-related-grid">
            {related.map((r) => (
              <Link to={`/journal/${r.slug}`} className="journal-related-card" key={r.id}>
                {r.coverImage && <img src={r.coverImage} alt={r.title} loading="lazy" />}
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}