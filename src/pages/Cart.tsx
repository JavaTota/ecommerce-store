import { useState } from "react";
import { Link } from "react-router-dom";
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
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
    setCheckoutMessage("");
    setCheckoutError("");

    if (!user) {
      setCheckoutError("Please login before checking out.");
      return;
    }

    if (cartItems.length > 4) {
      setCheckoutError(
        "This demo checkout supports up to 4 different products per order. Remove an item and try again."
      );
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderId = await createOrder(user, cartItems);
      dispatch(clearCart());
      setCheckoutMessage(
        `Order #${orderId.slice(0, 8).toUpperCase()} placed successfully.`
      );
    } catch (error) {
      console.error(error);
      setCheckoutError(
        error instanceof Error ? error.message : "Failed to place order."
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="container cart-empty-state">
          <h1>Your cart</h1>
          <p>{checkoutMessage || "Your cart is empty."}</p>
          {checkoutMessage ? (
            <Link className="primary-button" to="/orders">View your orders</Link>
          ) : (
            <Link className="primary-button" to="/">Continue shopping</Link>
          )}
        </div>
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

        {checkoutMessage && <div className="checkout-alert success">{checkoutMessage}</div>}
        {checkoutError && <div className="checkout-alert error">{checkoutError}</div>}

        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <Link to={`/products/${item.id}`}>
                  <img className="cart-image" src={item.image} alt={item.title} />
                </Link>

                <div>
                  <Link className="cart-product-title" to={`/products/${item.id}`}>
                    {item.title}
                  </Link>

                  <span className="cart-stock-note">
                    {item.stock} unit{item.stock === 1 ? "" : "s"} currently in stock
                  </span>

                  <div className="quantity-controls">
                    <button
                      className="quantity-button"
                      onClick={() => dispatch(decreaseQuantity(item.id))}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      className="quantity-button"
                      disabled={item.quantity >= item.stock || item.quantity >= 99}
                      onClick={() => dispatch(increaseQuantity(item.id))}
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
              disabled={isCheckingOut}
              onClick={handleCheckout}
            >
              {isCheckingOut ? "Checking stock…" : "Checkout"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;
