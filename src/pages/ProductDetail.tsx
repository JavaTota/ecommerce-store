import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { addToCart } from "../redux/cartSlice";
import { getProductById } from "../services/productService";
import type { Product } from "../types/product";
import "../styles/store.css";

function ProductDetail() {
  const { productId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        setProduct(await getProductById(productId));
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (loading) {
    return <main className="product-detail-page"><div className="container"><p>Loading product…</p></div></main>;
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="container store-empty-state">
          <h1>Product not found</h1>
          <Link className="primary-button" to="/">Back to shop</Link>
        </div>
      </main>
    );
  }

  const maxQuantity = Math.min(99, product.stock);
  const safeQuantity = Math.min(maxQuantity || 1, Math.max(1, quantity));

  const addProduct = () => {
    if (product.stock === 0) return;
    dispatch(addToCart({ product, quantity: safeQuantity }));
    setMessage(`${safeQuantity} × ${product.title} added to your cart.`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 3200);
  };

  return (
    <main className="product-detail-page">
      <div className="container">
        <Link className="back-link" to="/">← Back to shop</Link>

        <section className="product-detail-layout">
          <div className="product-detail-image-wrap">
            <img src={product.image} alt={product.title} />
          </div>

          <div className="product-detail-content">
            <span className="product-category">{product.category}</span>
            <h1>{product.title}</h1>
            <p className="product-detail-price">${product.price.toFixed(2)}</p>
            <p className="product-detail-description">{product.description}</p>

            <div className={`detail-stock ${product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "in"}`}>
              {product.stock === 0
                ? "Out of stock"
                : product.stock <= 5
                  ? `Only ${product.stock} left in stock`
                  : `${product.stock} units in stock`}
            </div>

            <div className="detail-purchase-row">
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max={maxQuantity || 1}
                  value={product.stock === 0 ? 0 : safeQuantity}
                  disabled={product.stock === 0}
                  onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                />
              </label>

              <button
                className="primary-button"
                type="button"
                disabled={product.stock === 0}
                onClick={addProduct}
              >
                {product.stock === 0 ? "Unavailable" : "Add to cart"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {message && (
        <div className="cart-toast" role="status" aria-live="polite">
          <span className="cart-toast-icon">✓</span>
          <div><strong>Added to cart</strong><span>{message}</span></div>
        </div>
      )}
    </main>
  );
}

export default ProductDetail;
