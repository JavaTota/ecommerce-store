import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Product, CartItem } from "../types/product";

interface CartState {
  cartItems: CartItem[];
}

interface AddToCartPayload {
  product: Product;
  quantity: number;
}

const MAX_ITEM_QUANTITY = 99;

const savedCart = sessionStorage.getItem("cart");

function loadSavedCart(): CartItem[] {
  if (!savedCart) return [];

  try {
    const parsed = JSON.parse(savedCart) as CartItem[];
    return parsed.map((item) => ({
      ...item,
      stock: Number.isInteger(item.stock) && item.stock >= 0 ? item.stock : 25,
    }));
  } catch {
    return [];
  }
}

const initialState: CartState = {
  cartItems: loadSavedCart(),
};

const saveCartToSessionStorage = (cartItems: CartItem[]) => {
  sessionStorage.setItem("cart", JSON.stringify(cartItems));
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { product, quantity } = action.payload;
      const stockLimit = Math.min(MAX_ITEM_QUANTITY, Math.max(0, product.stock));
      if (stockLimit === 0) return;

      const safeQuantity = Math.min(
        stockLimit,
        Math.max(1, Math.floor(quantity))
      );

      const existingItem = state.cartItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        existingItem.stock = product.stock;
        existingItem.quantity = Math.min(
          stockLimit,
          existingItem.quantity + safeQuantity
        );
      } else {
        state.cartItems.push({
          ...product,
          quantity: safeQuantity,
        });
      }

      saveCartToSessionStorage(state.cartItems);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id !== action.payload
      );

      saveCartToSessionStorage(state.cartItems);
    },

    clearCart: (state) => {
      state.cartItems = [];
      sessionStorage.removeItem("cart");
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.cartItems.find(
        (item) => item.id === action.payload
      );

      const stockLimit = item
        ? Math.min(MAX_ITEM_QUANTITY, Math.max(0, item.stock))
        : 0;

      if (item && item.quantity < stockLimit) {
        item.quantity += 1;
      }

      saveCartToSessionStorage(state.cartItems);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.cartItems.find(
        (item) => item.id === action.payload
      );

      if (item && item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.cartItems = state.cartItems.filter(
          (item) => item.id !== action.payload
        );
      }

      saveCartToSessionStorage(state.cartItems);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
