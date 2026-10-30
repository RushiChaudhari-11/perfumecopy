 // src/pages/admin/BlogEditor.jsx
 //
 // Admin-only create/edit form for a single journal post.
 // Route suggestions:
 //   /admin/journal/new       → create mode (no :id param)
 //   /admin/journal/:id/edit  → edit mode
 import React, { useEffect, useState } from "react";
 import { useNavigate, useParams, Navigate } from "react-router-dom";
 import { useAuth } from "../../contexts/AuthContext";
 import {
   createPost,
   updatePost,
   fetchPostById,
   generateSlug,
   estimateReadTime,
 } from "../../services/blogService";
 import "../../styles/blog-admin.css";
 
 const EMPTY_FORM = {
   title: "",
   slug: "",
   excerpt: "",
   content: "",
   coverImage: "",
   author: "Aura",
   tags: "", // comma-separated in the form, converted to an array on save
   status: "draft",
   metaTitle: "",
   metaDescription: "",
 };
 
 export default function BlogEditor() {
   const { id } = useParams(); // undefined in create mode
   const isEditMode = Boolean(id);
   const navigate = useNavigate();
 
   const { currentUser, user, loading: authLoading } = useAuth();
   const activeUser = currentUser ?? user ?? null;
 
   const [form, setForm] = useState(EMPTY_FORM);
   const [slugTouched, setSlugTouched] = useState(false);
   const [loading, setLoading] = useState(isEditMode);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState(null);
   const [notFound, setNotFound] = useState(false);
 
   useEffect(() => {
     if (!isEditMode) return;
     (async () => {
       try {
         const existing = await fetchPostById(id);
         if (!existing) {
           setNotFound(true);
           return;
         }
         setForm({
           title: existing.title || "",
           slug: existing.slug || "",
           excerpt: existing.excerpt || "",
           content: existing.content || "",
           coverImage: existing.coverImage || "",
           author: existing.author || "Aura",
           tags: (existing.tags || []).join(", "),
           status: existing.status || "draft",
           metaTitle: existing.metaTitle || "",
           metaDescription: existing.metaDescription || "",
         });
         setSlugTouched(true); // don't overwrite an existing slug on title edits
       } catch (err) {
         console.error("Failed to load post for editing:", err);
         setError("Couldn't load that post.");
       } finally {
         setLoading(false);
       }
     })();
   }, [id, isEditMode]);
 
   function handleTitleChange(value) {
     setForm((f) => ({
       ...f,
       title: value,
       slug: slugTouched ? f.slug : generateSlug(value),
     }));
   }
 
   function handleField(field, value) {
     setForm((f) => ({ ...f, [field]: value }));
   }
 
   async function handleSubmit(e, publish = null) {
     e.preventDefault();
     setError(null);
 
     if (!form.title.trim()) {
       setError("Give the post a title before saving.");
       return;
     }
     if (!form.slug.trim()) {
       setError("The post needs a URL slug.");
       return;
     }
 
     setSaving(true);
     try {
       const tags = form.tags
         .split(",")
         .map((t) => t.trim())
         .filter(Boolean);
 
       const payload = {
         title: form.title.trim(),
         slug: generateSlug(form.slug),
         excerpt: form.excerpt.trim(),
         content: form.content,
         coverImage: form.coverImage.trim(),
         author: form.author.trim() || "Aura",
         tags,
         status: publish ?? form.status,
         metaTitle: form.metaTitle.trim(),
         metaDescription: form.metaDescription.trim(),
         readTimeMinutes: estimateReadTime(form.content),
       };
 
       if (isEditMode) {
         await updatePost(id, payload);
       } else {
         await createPost(payload);
       }
       navigate("/admin/journal");
     } catch (err) {
       console.error("Failed to save post:", err);
       setError("Couldn't save this post. Check the console for details.");
     } finally {
       setSaving(false);
     }
   }
 
   // ── Guards ───────────────────────────────────────────────────────────
   if (authLoading || loading) return null;
   if (!activeUser?.isAdmin) return <Navigate to="/" replace />;
   if (notFound) return <Navigate to="/admin/journal" replace />;
 
   return (
     <main className="admin-journal">
       <header className="admin-journal-header">
         <h1>{isEditMode ? "Edit Post" : "New Post"}</h1>
       </header>
 
       {error && <p className="admin-error">{error}</p>}
 
       <form className="admin-editor-form" onSubmit={handleSubmit}>
         <label className="admin-field">
           <span>Title</span>
           <input
             type="text"
             value={form.title}
             onChange={(e) => handleTitleChange(e.target.value)}
             placeholder="Seven Notes of Oud"
             required
           />
         </label>
 
         <label className="admin-field">
           <span>Slug (URL)</span>
           <div className="admin-slug-row">
             <span className="admin-slug-prefix">/journal/</span>
             <input
               type="text"
               value={form.slug}
               onChange={(e) => {
                 setSlugTouched(true);
                 handleField("slug", e.target.value);
               }}
               placeholder="seven-notes-of-oud"
               required
             />
           </div>
         </label>
 
         <label className="admin-field">
           <span>Excerpt (used as the card teaser + fallback SEO description)</span>
           <textarea
             rows={2}
             value={form.excerpt}
             onChange={(e) => handleField("excerpt", e.target.value)}
             placeholder="A short walk through how oud moves from raw resin to a finished accord."
           />
         </label>
 
         <label className="admin-field">
           <span>Cover image URL</span>
           <input
             type="url"
             value={form.coverImage}
             onChange={(e) => handleField("coverImage", e.target.value)}
             placeholder="https://your-cdn.com/oud-cover.jpg"
           />
         </label>
 
         <div className="admin-field-row">
           <label className="admin-field">
             <span>Author</span>
             <input
               type="text"
               value={form.author}
               onChange={(e) => handleField("author", e.target.value)}
             />
           </label>
 
           <label className="admin-field">
             <span>Tags (comma-separated)</span>
             <input
               type="text"
               value={form.tags}
               onChange={(e) => handleField("tags", e.target.value)}
               placeholder="ingredients, oud, craft"
             />
           </label>
         </div>
 
         <label className="admin-field">
           <span>
             Content (HTML) — use {"<p>"}, {"<h2>"}, {"<blockquote>"}, {"<img>"} tags. This
             is rendered directly on the post page.
           </span>
           <textarea
             rows={16}
             className="admin-content-textarea"
             value={form.content}
             onChange={(e) => handleField("content", e.target.value)}
             placeholder="<p>Full post body goes here…</p>"
           />
         </label>
 
         <details className="admin-seo-fields">
           <summary>SEO overrides (optional — falls back to title/excerpt)</summary>
           <label className="admin-field">
             <span>Meta title</span>
             <input
               type="text"
               value={form.metaTitle}
               onChange={(e) => handleField("metaTitle", e.target.value)}
             />
           </label>
           <label className="admin-field">
             <span>Meta description</span>
             <textarea
               rows={2}
               value={form.metaDescription}
               onChange={(e) => handleField("metaDescription", e.target.value)}
             />
           </label>
         </details>
 
         <div className="admin-editor-actions">
           <button
             type="button"
             className="admin-btn"
             disabled={saving}
             onClick={(e) => handleSubmit(e, "draft")}
           >
             Save as draft
           </button>
           <button
             type="button"
             className="admin-btn admin-btn-primary"
             disabled={saving}
             onClick={(e) => handleSubmit(e, "published")}
           >
             {saving ? "Saving…" : "Publish"}
           </button>
         </div>
       </form>
     </main>
   );
 }
 