import { describe, expect, test } from "vitest";
import cartReducer, {
  addToCart,
  increaseQuantity,
} from "../redux/cartSlice";
import type { Product } from "../types/product";

const product: Product = {
  id: "product-1",
  title: "Test Product",
  price: 19.99,
  description: "A product used by the cart reducer tests.",
  category: "Tests",
  image: "https://example.com/product.jpg",
  stock: 2,
};

describe("cartSlice stock rules", () => {
  test("caps an add-to-cart quantity at available stock", () => {
    const state = cartReducer(
      { cartItems: [] },
      addToCart({ product, quantity: 10 })
    );

    expect(state.cartItems).toHaveLength(1);
    expect(state.cartItems[0].quantity).toBe(2);
  });

  test("does not increase a cart line beyond available stock", () => {
    const state = cartReducer(
      {
        cartItems: [{ ...product, quantity: 2 }],
      },
      increaseQuantity(product.id)
    );

    expect(state.cartItems[0].quantity).toBe(2);
  });

  test("does not exceed stock when the same product is added twice", () => {
    const firstState = cartReducer(
      { cartItems: [] },
      addToCart({ product, quantity: 1 })
    );

    const secondState = cartReducer(
      firstState,
      addToCart({ product, quantity: 2 })
    );

    expect(secondState.cartItems[0].quantity).toBe(2);
  });
});
