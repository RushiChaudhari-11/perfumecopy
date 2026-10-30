// src/pages/admin/BlogAdminList.jsx
//
// Admin-only view of ALL journal posts (draft + published). Route suggestion:
// /admin/journal
//
// Gated the same way your other admin pages are — this checks
// activeUser.isAdmin from AuthContext and redirects otherwise. Adjust the
// import path for useAuth if your admin pages check it differently.
import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase"; // ← adjust to match your actual firebase init file
import { deletePost, updatePost } from "../../services/blogService";
import "../../styles/blog-admin.css";

// Firestore Timestamp fields (createdAt/updatedAt/publishedAt) don't survive
// JSON.stringify as-is — convert them to ISO strings on the way out so the
// exported file is plain, portable JSON.
function serializePostForExport(p) {
  const toISO = (val) => (val?.toDate ? val.toDate().toISOString() : val || null);
  return {
    ...p,
    createdAt: toISO(p.createdAt),
    updatedAt: toISO(p.updatedAt),
    publishedAt: toISO(p.publishedAt),
  };
}

export default function BlogAdminList() {
  const { currentUser, user, loading: authLoading } = useAuth();
  const activeUser = currentUser ?? user ?? null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!activeUser?.isAdmin) return;
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.isAdmin]);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      // Admin view needs everything, drafts included, so this bypasses
      // blogService's public "published only" queries and reads directly.
      const q = query(collection(db, "blogPosts"), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load posts for admin:", err);
      setError("Couldn't load posts. Check the console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(post) {
    setBusyId(post.id);
    try {
      const nextStatus = post.status === "published" ? "draft" : "published";
      await updatePost(post.id, { status: nextStatus });
      await loadPosts();
    } catch (err) {
      console.error("Failed to update post status:", err);
      alert("Couldn't update that post's status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusyId(post.id);
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Couldn't delete that post.");
    } finally {
      setBusyId(null);
    }
  }

  // Downloads every loaded post (draft + published) as a single JSON file —
  // no extra Firestore read needed, since `posts` already holds everything
  // from loadPosts() above.
  function handleExport() {
    if (!posts.length) {
      alert("There are no posts to export yet.");
      return;
    }
    try {
      const exportData = posts.map(serializePostForExport);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `journal-posts-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed: " + (err.message || err));
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────
  if (authLoading) return null;
  if (!activeUser?.isAdmin) return <Navigate to="/" replace />;

  return (
    <main className="admin-journal">
      <header className="admin-journal-header">
        <h1>Journal — Manage Posts</h1>
        <div className="admin-journal-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={handleExport}
            title="Download all posts as a JSON file"
          >
            Export
          </button>
          <Link to="/admin/journal/new" className="admin-btn admin-btn-primary">
            + New Post
          </Link>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="admin-muted">
          No posts yet.{" "}
          <Link to="/admin/journal/new">Write your first one</Link>.
        </p>
      ) : (
        <table className="admin-journal-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Views</th>
              <th>Updated</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <span className="admin-post-title">{post.title || "(untitled)"}</span>
                  <span className="admin-post-slug">/journal/{post.slug}</span>
                </td>
                <td>
                  <span className={`admin-status-pill ${post.status}`}>{post.status}</span>
                </td>
                <td>{post.views ?? 0}</td>
                <td>{post.updatedAt?.toDate ? post.updatedAt.toDate().toLocaleDateString() : "—"}</td>
                <td className="admin-row-actions">
                  <Link to={`/admin/journal/${post.id}/edit`} className="admin-link-btn">
                    Edit
                  </Link>
                  <button
                    className="admin-link-btn"
                    disabled={busyId === post.id}
                    onClick={() => togglePublish(post)}
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="admin-link-btn admin-link-btn-danger"
                    disabled={busyId === post.id}
                    onClick={() => handleDelete(post)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
