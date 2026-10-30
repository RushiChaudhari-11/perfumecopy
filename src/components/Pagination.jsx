// src/components/Pagination.jsx
//
// Reusable "load more" pagination control. Deliberately dumb — it just
// renders a button/state based on props and calls onLoadMore. All the
// cursor/query logic stays in the page that owns the data (BlogList.jsx),
// so this component has no idea it's paginating blog posts specifically
// and could be reused anywhere else you paginate a list.
import React from "react";
import "../styles/pagination.css";

/**
 * @param {object} props
 * @param {boolean} props.hasMore       whether another page exists
 * @param {boolean} props.loading       true while the next page is being fetched
 * @param {() => void} props.onLoadMore called when the button is pressed
 * @param {string} [props.label]        idle button label
 * @param {string} [props.loadingLabel] label shown while loading
 * @param {string} [props.doneLabel]    optional message shown when hasMore is false
 */
export default function Pagination({
  hasMore,
  loading,
  onLoadMore,
  label = "Load more",
  loadingLabel = "Loading…",
  doneLabel = null,
}) {
  if (!hasMore) {
    return doneLabel ? <p className="pagination-done">{doneLabel}</p> : null;
  }

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={onLoadMore}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? loadingLabel : label}
      </button>
    </div>
  );
}
