// src/services/blogService.js
//
// Firestore data access for the blog / "Journal" feature.
//
// ⚠️ ADJUST THIS IMPORT to match wherever you initialize Firebase in your
// project (the file that exports `db` from getFirestore()). Based on your
// AuthContext import style ("../contexts/AuthContext"), this is probably
// "../firebase" or "../config/firebase" — check and fix if needed.
import { db } from "../firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
} from "firebase/firestore";

const POSTS_COLLECTION = "blogPosts";

// ─── Firestore document shape ──────────────────────────────────────────────
// {
//   title: string,
//   slug: string,               // unique, url-safe, e.g. "seven-notes-of-oud"
//   excerpt: string,            // 1-2 sentence teaser, used for cards + meta description
//   content: string,            // HTML string (sanitize on render, see BlogPost.jsx)
//   coverImage: string,         // absolute URL
//   author: string,
//   tags: string[],
//   status: "draft" | "published",
//   metaTitle?: string,         // overrides <title> if present
//   metaDescription?: string,   // overrides excerpt for SEO if present
//   readTimeMinutes?: number,   // auto-estimated on create if omitted
//   views: number,
//   publishedAt: Timestamp | null,
//   updatedAt: Timestamp,
//   createdAt: Timestamp,
// }

/**
 * Fetch a page of published posts, newest first.
 * @param {{ pageSize?: number, cursor?: import('firebase/firestore').QueryDocumentSnapshot|null, tag?: string|null }} opts
 * @returns {Promise<{ posts: Array<object>, lastDoc: any, hasMore: boolean }>}
 */
export async function fetchPublishedPosts({ pageSize = 9, cursor = null, tag = null } = {}) {
  const clauses = [
    collection(db, POSTS_COLLECTION),
    where("status", "==", "published"),
  ];

  if (tag) clauses.push(where("tags", "array-contains", tag));

  clauses.push(orderBy("publishedAt", "desc"));
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(pageSize + 1)); // fetch one extra to know if there's a next page

  const q = query(...clauses);
  const snap = await getDocs(q);

  const docs = snap.docs.slice(0, pageSize);
  const posts = docs.map((d) => ({ id: d.id, ...d.data() }));
  const hasMore = snap.docs.length > pageSize;
  const lastDoc = docs.length ? docs[docs.length - 1] : null;

  return { posts, lastDoc, hasMore };
}

/**
 * Fetch a single published post by its slug. Returns null if not found
 * (or found but not published — treat as 404 either way).
 */
export async function fetchPostBySlug(slug) {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Fetch a handful of other published posts sharing at least one tag,
 * excluding the current post. Falls back to "most recent" if the post
 * has no tags or nothing else matches.
 */
export async function fetchRelatedPosts(currentPost, count = 3) {
  if (!currentPost) return [];

  let posts = [];
  if (currentPost.tags?.length) {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("status", "==", "published"),
      where("tags", "array-contains-any", currentPost.tags.slice(0, 10)),
      orderBy("publishedAt", "desc"),
      limit(count + 1)
    );
    const snap = await getDocs(q);
    posts = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.id !== currentPost.id);
  }

  if (posts.length < count) {
    const { posts: recent } = await fetchPublishedPosts({ pageSize: count + 1 });
    const merged = [...posts];
    for (const p of recent) {
      if (p.id === currentPost.id) continue;
      if (merged.find((m) => m.id === p.id)) continue;
      merged.push(p);
      if (merged.length >= count) break;
    }
    posts = merged;
  }

  return posts.slice(0, count);
}

/** Fire-and-forget view counter. Never throws — a failed view count should never break the page. */
export async function incrementPostViews(postId) {
  if (!postId) return;
  try {
    await updateDoc(doc(db, POSTS_COLLECTION, postId), { views: increment(1) });
  } catch (err) {
    console.warn("Could not increment post views:", err);
  }
}

// ─── Admin CRUD (gate these behind your isAdmin check in the UI) ──────────

export async function createPost(data) {
  const slug = data.slug || generateSlug(data.title);
  const readTimeMinutes = data.readTimeMinutes || estimateReadTime(data.content || "");

  const payload = {
    ...data,
    slug,
    readTimeMinutes,
    views: 0,
    status: data.status || "draft",
    publishedAt: data.status === "published" ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, POSTS_COLLECTION), payload);
  return ref.id;
}

export async function updatePost(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };

  // If this update is what flips the post to "published" for the first time,
  // stamp publishedAt now so ordering/SEO dates are correct.
  if (data.status === "published" && !data.publishedAt) {
    const existing = await getDoc(doc(db, POSTS_COLLECTION, id));
    if (!existing.data()?.publishedAt) {
      payload.publishedAt = serverTimestamp();
    }
  }

  await updateDoc(doc(db, POSTS_COLLECTION, id), payload);
}

export async function deletePost(id) {
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
}

/** Fetch a single post by id regardless of status — for the admin editor. */
export async function fetchPostById(id) {
  const snap = await getDoc(doc(db, POSTS_COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generateSlug(title = "") {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** ~200 words/minute, minimum 1 minute. Strips HTML tags before counting. */
export function estimateReadTime(html = "") {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
