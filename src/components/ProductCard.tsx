import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { addToCart } from "../redux/cartSlice";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <article className="product-card">
      <div className="product-image-container">
        <img
          className="product-image"
          src={product.image}
          alt={product.title}
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/300";
          }}
        />
      </div>

      <div className="product-content">
        <span className="product-category">{product.category}</span>

        <h3 className="product-title">{product.title}</h3>

        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <p className="product-price">${Number(product.price).toFixed(2)}</p>

          <button
            className="primary-button"
            onClick={() => dispatch(addToCart(product))}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;