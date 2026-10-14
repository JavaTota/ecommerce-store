import { useEffect, useState } from "react";
import {
  getProductsFromFirestore,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import { seedProducts } from "../services/seedProducts";
import type { Product } from "../types/product";
import "../styles/products.css";

function Products() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    title: "",
    price: 0,
    description: "",
    category: "",
    image: "",
  });

  const loadProducts = async () => {
    const data = await getProductsFromFirestore();
    setProducts(data);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const handleCreateProduct = async () => {
    if (
      !newProduct.title ||
      !newProduct.category ||
      !newProduct.image ||
      !newProduct.description
    ) {
      alert("Please complete all fields.");
      return;
    }

    await createProduct(newProduct);

    setNewProduct({
      title: "",
      price: 0,
      description: "",
      category: "",
      image: "",
    });

    await loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    await deleteProduct(id);
    await loadProducts();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    await updateProduct(editingProduct.id, {
      title: editingProduct.title,
      price: editingProduct.price,
      description: editingProduct.description,
      category: editingProduct.category,
      image: editingProduct.image,
    });

    setEditingProduct(null);
    await loadProducts();
  };

  const handleImportProducts = async () => {
    if (products.length > 0) {
      const confirmed = window.confirm(
        "Products already exist. Importing again may create duplicates. Continue?"
      );

      if (!confirmed) return;
    }

    try {
      setIsImporting(true);

      const count = await seedProducts();

      await loadProducts();

      alert(`${count} demo products imported successfully.`);
    } catch (error) {
      console.error(error);
      alert("Could not import products.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <p className="admin-label">Store administration</p>
            <h1>Product Management</h1>
            <p>
              Create, edit and manage the products available in your store.
            </p>
          </div>

          <button
            className="import-button"
            onClick={handleImportProducts}
            disabled={isImporting}
          >
            {isImporting ? "Importing..." : "Import Demo Products"}
          </button>
        </div>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Add product</h2>
              <p>Create a new product in your Firestore database.</p>
            </div>
          </div>

          <div className="product-form">
            <div className="form-group">
              <label>Title</label>
              <input
                placeholder="Product name"
                value={newProduct.title}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                placeholder="e.g. electronics"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    category: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                placeholder="https://..."
                value={newProduct.image}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    image: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group form-group-full">
              <label>Description</label>
              <textarea
                placeholder="Product description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-actions">
              <button
                className="primary-button"
                onClick={handleCreateProduct}
              >
                Create Product
              </button>
            </div>
          </div>
        </section>

        {editingProduct && (
          <section className="admin-card edit-card">
            <div className="admin-card-header">
              <div>
                <h2>Edit product</h2>
                <p>Update the selected product.</p>
              </div>

              <button
                className="cancel-button"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
            </div>

            <div className="product-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  value={editingProduct.title}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  value={editingProduct.category}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  value={editingProduct.image}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      image: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group form-group-full">
                <label>Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  className="primary-button"
                  onClick={handleUpdateProduct}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <h2>Inventory</h2>
              <p>
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="products-empty">
              <h3>No products yet</h3>
              <p>
                Add one manually or import the demo product catalog.
              </p>

              <button
                className="primary-button"
                onClick={handleImportProducts}
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : "Import Demo Products"}
              </button>
            </div>
          ) : (
            <div className="admin-products-grid">
              {products.map((product) => (
                <article className="admin-product-card" key={product.id}>
                  <div className="admin-product-image-wrapper">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="admin-product-image"
                    />
                  </div>

                  <div className="admin-product-content">
                    <span className="admin-product-category">
                      {product.category}
                    </span>

                    <h3>{product.title}</h3>

                    <p className="admin-product-price">
                      ${Number(product.price).toFixed(2)}
                    </p>

                    <div className="admin-product-actions">
                      <button
                        className="edit-button"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Products;