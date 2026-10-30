// src/contexts/CartContext.jsx
import React, { createContext, useContext, useEffect, useReducer } from "react";

// ---------------- Reducer & Context ----------------
const CartContext = createContext();

const initialState = {
  items: [], // each item: { id, uniqueId, name, imageUrl, volume, price, qty }
  isMiniOpen: false,
};

function calcTotals(items = []) {
  const totalQty = items.reduce((sum, it) => sum + (it.qty || 1), 0);
  const subtotal = items.reduce((sum, it) => {
    const rawP = typeof it.price === "number" ? it.price : 0;
    const price = rawP >= 10000 ? Math.round(rawP / 100) : rawP;
    return sum + price * (it.qty || 1);
  }, 0);
  return { totalQty, subtotal };
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_FROM_STORAGE": {
      const raw = action.payload || [];
      const sanitized = raw.map((it) => {
        const vol = it.volume || "50ml";
        const uid = it.uniqueId || `${it.id}-${vol}`;
        const rawP = typeof it.price === "number" ? it.price : 0;
        const price = rawP >= 10000 ? Math.round(rawP / 100) : rawP;
        return {
          ...it,
          uniqueId: uid,
          volume: vol,
          price,
          qty: Math.max(1, it.qty || 1),
        };
      });
      return { ...state, items: sanitized };
    }

    case "ADD_ITEM": {
      const variant = action.payload || {};
      const vol = variant.volume || "50ml";
      const uid = variant.uniqueId || `${variant.id}-${vol}`;
      const rawPrice = typeof variant.price === "number" ? variant.price : 0;
      const price = rawPrice >= 10000 ? Math.round(rawPrice / 100) : rawPrice;

      const itemToAdd = {
        ...variant,
        uniqueId: uid,
        volume: vol,
        price,
      };

      const existingIndex = state.items.findIndex(
        (i) => (i.uniqueId || `${i.id}-${i.volume || "50ml"}`) === uid
      );

      let newItems;
      if (existingIndex > -1) {
        newItems = state.items.map((i, idx) =>
          idx === existingIndex
            ? { ...i, ...itemToAdd, qty: (i.qty || 1) + (variant.qty || 1) }
            : i
        );
      } else {
        newItems = [...state.items, { ...itemToAdd, qty: variant.qty || 1 }];
      }
      return {
        ...state,
        items: newItems,
        isMiniOpen: variant.openDrawer === true,
      };
    }

    case "REMOVE_ITEM": {
      const targetId = action.payload;
      return {
        ...state,
        items: state.items.filter((i) => {
          const itUid = i.uniqueId || `${i.id}-${i.volume || "50ml"}`;
          return itUid !== targetId && i.id !== targetId;
        }),
      };
    }

    case "UPDATE_QTY": {
      const { uniqueId, qty } = action.payload;
      if (qty <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => {
            const itUid = i.uniqueId || `${i.id}-${i.volume || "50ml"}`;
            return itUid !== uniqueId && i.id !== uniqueId;
          }),
        };
      }
      return {
        ...state,
        items: state.items.map((i) => {
          const itUid = i.uniqueId || `${i.id}-${i.volume || "50ml"}`;
          return itUid === uniqueId || i.id === uniqueId
            ? { ...i, uniqueId: itUid, qty }
            : i;
        }),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "OPEN_MINI":
      return { ...state, isMiniOpen: true };
    case "CLOSE_MINI":
      return { ...state, isMiniOpen: false };
    case "TOGGLE_MINI":
      return { ...state, isMiniOpen: !state.isMiniOpen };

    default:
      return state;
  }
}

// ---------------- Provider ----------------
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load items on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartItems");
      if (stored) dispatch({ type: "LOAD_FROM_STORAGE", payload: JSON.parse(stored) });
    } catch (err) {
      console.warn("Cart load failed", err);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    } catch (err) {
      console.warn("Cart save failed", err);
    }
  }, [state.items]);

  // Actions
  const addToCart = (variant, qty = 1) =>
    dispatch({ type: "ADD_ITEM", payload: { ...variant, qty } });

  const addItem = (variant, qty = 1) =>
    dispatch({ type: "ADD_ITEM", payload: { ...variant, qty } });

  const removeFromCart = (uniqueId) => dispatch({ type: "REMOVE_ITEM", payload: uniqueId });

  const updateQty = (uniqueId, qty) =>
    dispatch({ type: "UPDATE_QTY", payload: { uniqueId, qty } });

  const getItemQty = (uniqueId) => {
    if (!uniqueId) return 0;
    const found = state.items.find(
      (i) =>
        (i.uniqueId || `${i.id}-${i.volume || "50ml"}`) === uniqueId ||
        i.uniqueId === uniqueId ||
        i.id === uniqueId
    );
    return found ? (found.qty || 0) : 0;
  };

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const openMini = () => dispatch({ type: "OPEN_MINI" });
  const closeMini = () => dispatch({ type: "CLOSE_MINI" });
  const toggleMini = () => dispatch({ type: "TOGGLE_MINI" });

  const { subtotal, totalQty } = calcTotals(state.items);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        addItem,
        removeFromCart,
        updateQty,
        getItemQty,
        clearCart,
        subtotal,
        totalQty,
        isMiniOpen: state.isMiniOpen,
        openMini,
        closeMini,
        toggleMini,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
