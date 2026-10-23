import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import {
  clearCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
} from "../redux/cartSlice";
import { createOrder } from "../services/orderService";
import { useAuth } from "../context/useAuth";
import "../styles/store.css";

function Cart() {
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const cartItems = useSelector((state: RootState) => state.cart.cartItems);

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (!user) {
      setCheckoutMessage("Please login before checking out.");
      return;
    }

    if (cartItems.length > 4) {
      setCheckoutMessage(
        "This demo checkout supports up to 4 different products per order. Remove an item and try again."
      );
      return;
    }

    try {
      await createOrder(user.uid, cartItems);
      dispatch(clearCart());
      setCheckoutMessage("Order placed successfully!");
    } catch (error) {
      console.error(error);
      setCheckoutMessage("Failed to place order.");
    }
  };

  if (cartItems.length === 0) {
    return (
      <main style={{ padding: "1rem" }}>
        <h1>Your Cart</h1>
        <p>{checkoutMessage || "Your cart is empty."}</p>
      </main>
    );
  }

  return (
  <main className="cart-page">
    <div className="container">
      <div className="page-heading">
        <h1>Your cart</h1>
        <p>Review your items before checkout.</p>
      </div>

      {checkoutMessage && <p>{checkoutMessage}</p>}

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <article className="cart-item" key={item.id}>
              <img
                className="cart-image"
                src={item.image}
                alt={item.title}
              />

              <div>
                <h3 className="cart-product-title">{item.title}</h3>

                <div className="quantity-controls">
                  <button
                    className="quantity-button"
                    onClick={() =>
                      dispatch(decreaseQuantity(item.id))
                    }
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    className="quantity-button"
                    onClick={() =>
                      dispatch(increaseQuantity(item.id))
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className="remove-button"
                  onClick={() => dispatch(removeFromCart(item.id))}
                >
                  Remove
                </button>
              </div>

              <div className="cart-item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>

          <div className="summary-row">
            <span>Items</span>
            <span>{totalItems}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            className="primary-button checkout-button"
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </aside>
      </div>
    </div>
  </main>
);
}

export default Cart;