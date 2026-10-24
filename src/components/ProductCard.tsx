import { useEffect, useRef, useState } from "react";
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
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const updateQuantity = (nextQuantity: number) => {
    const safeQuantity = Math.min(
      MAX_QUANTITY,
      Math.max(1, Math.floor(nextQuantity || 1))
    );

    setQuantity(safeQuantity);
  };

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        product,
        quantity,
      })
    );

    setCartMessage(
      `${quantity} × ${product.title} added to your cart.`
    );

    setQuantity(1);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setCartMessage("");
    }, 3200);
  };

  return (
    <>
      <article className="product-card">
        <div className="product-image-container">
          <img
            className="product-image"
            src={product.image}
            alt={product.title}
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>

        <div className="product-content">
          <span className="product-category">{product.category}</span>

          <h3 className="product-title">{product.title}</h3>

          <p className="product-description">{product.description}</p>

          <p className="product-price">
            ${Number(product.price).toFixed(2)}
          </p>

          <div className="product-purchase-row">
            <div
              className="product-quantity-control"
              aria-label={`Quantity for ${product.title}`}
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => updateQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                −
              </button>

              <input
                aria-label="Quantity"
                type="number"
                min="1"
                max={MAX_QUANTITY}
                value={quantity}
                onChange={(event) =>
                  updateQuantity(Number(event.target.value))
                }
              />

              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => updateQuantity(quantity + 1)}
                disabled={quantity >= MAX_QUANTITY}
              >
                +
              </button>
            </div>

            <button
              className="primary-button product-add-button"
              type="button"
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
          </div>
        </div>
      </article>

      {cartMessage && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span className="cart-toast-icon" aria-hidden="true">
            ✓
          </span>
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
