// src/contexts/WishlistContext.jsx
import React, { createContext, useContext, useEffect, useReducer } from "react";

// ---------------- Reducer & Context ----------------
const WishlistContext = createContext();

const initialState = {
  items: [], // each item: { id, name, imageUrl, price, ...rest of product }
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_FROM_STORAGE":
      return { ...state, items: action.payload || [] };

    case "ADD_ITEM": {
      const product = action.payload;
      const exists = state.items.some((i) => i.id === product.id);
      if (exists) return state; // already wishlisted, no-op
      return { ...state, items: [...state.items, product] };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };

    case "TOGGLE_ITEM": {
      const product = action.payload;
      const exists = state.items.some((i) => i.id === product.id);
      if (exists) {
        return { ...state, items: state.items.filter((i) => i.id !== product.id) };
      }
      return { ...state, items: [...state.items, product] };
    }

    case "CLEAR_WISHLIST":
      return { ...state, items: [] };

    default:
      return state;
  }
}

// ---------------- Provider ----------------
export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wishlistItems");
      if (stored) dispatch({ type: "LOAD_FROM_STORAGE", payload: JSON.parse(stored) });
    } catch (err) {
      console.warn("Wishlist load failed", err);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    } catch (err) {
      console.warn("Wishlist save failed", err);
    }
  }, [state.items]);

  // Actions
  const addToWishlist = (product) => dispatch({ type: "ADD_ITEM", payload: product });
  const removeFromWishlist = (productId) => dispatch({ type: "REMOVE_ITEM", payload: productId });
  const toggleWishlist = (product) => dispatch({ type: "TOGGLE_ITEM", payload: product });
  const clearWishlist = () => dispatch({ type: "CLEAR_WISHLIST" });
  const isWishlisted = (productId) => state.items.some((i) => i.id === productId);

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        count: state.items.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
