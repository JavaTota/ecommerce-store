import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { addToCart } from "../redux/cartSlice";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

const MAX_QUANTITY = 99;

function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const maxQuantity = Math.min(MAX_QUANTITY, product.stock);
  const [quantity, setQuantity] = useState(maxQuantity > 0 ? 1 : 0);
  const [cartMessage, setCartMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const displayedQuantity =
    maxQuantity > 0 ? Math.min(maxQuantity, Math.max(1, quantity)) : 0;

  const updateQuantity = (nextQuantity: number) => {
    if (maxQuantity <= 0) return;

    setQuantity(
      Math.min(maxQuantity, Math.max(1, Math.floor(nextQuantity || 1)))
    );
  };

  const handleAddToCart = () => {
    if (product.stock <= 0) return;

    dispatch(addToCart({ product, quantity: displayedQuantity }));
    setCartMessage(`${displayedQuantity} × ${product.title} added to your cart.`);
    setQuantity(1);

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCartMessage(""), 3200);
  };

  return (
    <>
      <article className="product-card">
        <Link
          className="product-image-container"
          to={`/products/${product.id}`}
          aria-label={`View ${product.title}`}
        >
          <img
            className="product-image"
            src={product.image}
            alt={product.title}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        </Link>

        <div className="product-content">
          <span className="product-category">{product.category}</span>

          <h3 className="product-title">
            <Link to={`/products/${product.id}`}>{product.title}</Link>
          </h3>

          <p className="product-description">{product.description}</p>

          <div className="product-stock-row">
            <p className="product-price">${Number(product.price).toFixed(2)}</p>
            <span
              className={`stock-badge ${
                product.stock === 0
                  ? "out"
                  : product.stock <= 5
                    ? "low"
                    : "in"
              }`}
            >
              {product.stock === 0
                ? "Out of stock"
                : product.stock <= 5
                  ? `Only ${product.stock} left`
                  : "In stock"}
            </span>
          </div>

          <div className="product-purchase-row">
            <div
              className="product-quantity-control"
              aria-label={`Quantity for ${product.title}`}
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => updateQuantity(displayedQuantity - 1)}
                disabled={displayedQuantity <= 1 || product.stock === 0}
              >
                −
              </button>

              <input
                aria-label="Quantity"
                type="number"
                min="1"
                max={maxQuantity || 1}
                value={displayedQuantity || ""}
                disabled={product.stock === 0}
                onChange={(event) => updateQuantity(Number(event.target.value))}
              />

              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => updateQuantity(displayedQuantity + 1)}
                disabled={displayedQuantity >= maxQuantity || product.stock === 0}
              >
                +
              </button>
            </div>

            <button
              className="primary-button product-add-button"
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? "Unavailable" : "Add to cart"}
            </button>
          </div>

          <Link className="product-details-link" to={`/products/${product.id}`}>
            View details
          </Link>
        </div>
      </article>

      {cartMessage && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span className="cart-toast-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Added to cart</strong>
            <span>{cartMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductCard;
