import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProductsFromFirestore } from "../services/productService";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";
import "../styles/store.css";

const PAGE_SIZE = 12;

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") ?? "";
  const selectedCategory = searchParams.get("category") ?? "";
  const sortOption = (searchParams.get("sort") ?? "featured") as SortOption;
  const requestedPage = Number(searchParams.get("page") ?? "1");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProductsFromFirestore();
        setProducts(data);
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      const matchesSearch =
        !normalizedSearch ||
        product.title.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    return [...result].sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-asc":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [products, searchTerm, selectedCategory, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(
    totalPages,
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
  );

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  return (
    <main className="store-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <p className="hero-label">Curated essentials</p>
            <h1>Simple products. Better shopping.</h1>
            <p className="hero-description">
              Search, compare and shop a live catalog backed by Firestore.
            </p>
          </div>
        </div>
      </section>

      <section className="shop-section">
        <div className="container">
          <div className="shop-header shop-header-expanded">
            <div className="shop-title">
              <h2>Shop products</h2>
              <p>
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            <div className="shop-controls">
              <label className="shop-search">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  placeholder="Search products…"
                  value={searchTerm}
                  onChange={(event) => updateParam("search", event.target.value)}
                />
              </label>

              <select
                className="category-select"
                value={selectedCategory}
                onChange={(event) => updateParam("category", event.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                className="category-select"
                value={sortOption}
                onChange={(event) => updateParam("sort", event.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="store-empty-state"><h3>Loading products…</h3></div>
          ) : visibleProducts.length === 0 ? (
            <div className="store-empty-state">
              <h3>No products found</h3>
              <p>Try another search term or category.</p>
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => updateParam("page", String(currentPage - 1))}
              >
                Previous
              </button>

              <span>Page {currentPage} of {totalPages}</span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => updateParam("page", String(currentPage + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
