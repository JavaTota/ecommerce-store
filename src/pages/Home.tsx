import { useEffect, useState } from "react";
import { getProductsFromFirestore } from "../services/productService";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";
import "../styles/store.css";

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProductsFromFirestore();
      setProducts(data);
    };

    void loadProducts();
  }, []);

  const categories = [
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  return (
    <main className="store-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <p className="hero-label">Curated essentials</p>

            <h1>Simple products. Better shopping.</h1>

            <p className="hero-description">
              Discover our collection of everyday products, carefully selected
              and ready to add to your cart.
            </p>
          </div>
        </div>
      </section>

      <section className="shop-section">
        <div className="container">
          <div className="shop-header">
            <div className="shop-title">
              <h2>Shop products</h2>
              <p>
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;