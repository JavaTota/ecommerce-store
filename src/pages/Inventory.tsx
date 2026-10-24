import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteProduct,
  deleteProducts,
  getProductsFromFirestore,
  updateProduct,
} from "../services/productService";
import type { Product } from "../types/product";
import "../styles/inventory.css";

type DeleteRequest =
  | {
      type: "single";
      id: string;
      title: string;
    }
  | {
      type: "bulk";
      ids: string[];
    };

function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const deleteToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProducts = async () => {
    const data = await getProductsFromFirestore();
    setProducts(data);
  };

  useEffect(() => {
    let isActive = true;

    void getProductsFromFirestore().then((data) => {
      if (isActive) setProducts(data);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (deleteToastTimer.current) {
        clearTimeout(deleteToastTimer.current);
      }
    };
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      selectedCategory
        ? products.filter((product) => product.category === selectedCategory)
        : products,
    [products, selectedCategory]
  );

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.has(product.id));

  const showDeleteSuccess = (text: string) => {
    setDeleteSuccessMessage(text);

    if (deleteToastTimer.current) {
      clearTimeout(deleteToastTimer.current);
    }

    deleteToastTimer.current = setTimeout(() => {
      setDeleteSuccessMessage("");
    }, 3200);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedIds(new Set());
    setMessage("");
    setError("");
  };

  const toggleProductSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filteredProducts.forEach((product) => next.delete(product.id));
      } else {
        filteredProducts.forEach((product) => next.add(product.id));
      }

      return next;
    });
  };

  const requestSingleDelete = (product: Product) => {
    setError("");
    setMessage("");
    setDeleteRequest({
      type: "single",
      id: product.id,
      title: product.title,
    });
  };

  const requestBulkDelete = () => {
    const ids = [...selectedIds];

    if (ids.length === 0) return;

    setError("");
    setMessage("");
    setDeleteRequest({
      type: "bulk",
      ids,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteRequest) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      if (deleteRequest.type === "single") {
        await deleteProduct(deleteRequest.id);

        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(deleteRequest.id);
          return next;
        });

        showDeleteSuccess("Product deleted successfully.");
      } else {
        await deleteProducts(deleteRequest.ids);
        setSelectedIds(new Set());
        showDeleteSuccess(
          `${deleteRequest.ids.length} product${
            deleteRequest.ids.length === 1 ? "" : "s"
          } deleted successfully.`
        );
      }

      setDeleteRequest(null);
      await loadProducts();
    } catch (deleteError) {
      console.error("Failed to delete product(s):", deleteError);
      setError(
        deleteRequest.type === "single"
          ? "The product could not be deleted. Please try again."
          : "The selected products could not be deleted. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const title = editingProduct.title.trim();
    const category = editingProduct.category.trim();
    const description = editingProduct.description.trim();
    const image = editingProduct.image.trim();
    const price = Number(editingProduct.price);

    if (!title || !category || !description || price <= 0) {
      setError("Complete every product field and enter a price above $0.");
      return;
    }

    if (!image.startsWith("https://")) {
      setError("The product image URL must start with https://.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProduct(editingProduct.id, {
        title,
        price: Number(price.toFixed(2)),
        description,
        category,
        image,
      });

      setEditingProduct(null);
      setMessage("Product updated successfully.");
      await loadProducts();
    } catch (updateError) {
      console.error("Failed to update product:", updateError);
      setError("The product could not be updated. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="inventory-page">
      <div className="container">
        <header className="inventory-page-header">
          <div>
            <p className="inventory-eyebrow">Store administration</p>
            <h1>Inventory</h1>
            <p>
              Browse, filter, update, select and delete products from your catalog.
            </p>
          </div>
        </header>

        {error && (
          <div className="inventory-alert inventory-alert-error" role="alert">
            <strong>Inventory action failed</strong>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="inventory-alert inventory-alert-success" role="status">
            <strong>Success</strong>
            <span>{message}</span>
          </div>
        )}

        <section className="inventory-toolbar" aria-label="Inventory controls">
          <div className="inventory-filter-group">
            <label htmlFor="inventory-category">Category</label>
            <select
              id="inventory-category"
              value={selectedCategory}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="inventory-toolbar-summary">
            <strong>{filteredProducts.length}</strong>
            <span>
              {filteredProducts.length === 1 ? "product visible" : "products visible"}
            </span>
          </div>

          <div className="inventory-selection-actions">
            <button
              type="button"
              className="inventory-secondary-button"
              disabled={filteredProducts.length === 0}
              onClick={toggleSelectAllFiltered}
            >
              {allFilteredSelected ? "Clear visible selection" : "Select all visible"}
            </button>

            <button
              type="button"
              className="inventory-delete-selected"
              disabled={selectedIds.size === 0 || isDeleting}
              onClick={requestBulkDelete}
            >
              {`Delete selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
            </button>
          </div>
        </section>

        {editingProduct && (
          <section className="inventory-edit-panel">
            <div className="inventory-edit-header">
              <div>
                <p className="inventory-eyebrow">Editing product</p>
                <h2>{editingProduct.title}</h2>
              </div>

              <button
                type="button"
                className="inventory-secondary-button"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
            </div>

            <div className="inventory-edit-grid">
              <div className="inventory-field">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  value={editingProduct.title}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: event.target.value,
                    })
                  }
                />
              </div>

              <div className="inventory-field">
                <label htmlFor="edit-price">Price</label>
                <input
                  id="edit-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className="inventory-field">
                <label htmlFor="edit-category">Category</label>
                <input
                  id="edit-category"
                  value={editingProduct.category}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: event.target.value,
                    })
                  }
                />
              </div>

              <div className="inventory-field">
                <label htmlFor="edit-image">Image URL</label>
                <input
                  id="edit-image"
                  type="url"
                  value={editingProduct.image}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      image: event.target.value,
                    })
                  }
                />
              </div>

              <div className="inventory-field inventory-field-full">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <div className="inventory-edit-preview inventory-field-full">
                <span>Image preview</span>
                <img src={editingProduct.image} alt={editingProduct.title} />
              </div>
            </div>

            <div className="inventory-edit-actions">
              <button
                type="button"
                className="primary-button"
                disabled={isSaving}
                onClick={handleUpdateProduct}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>
        )}

        {filteredProducts.length === 0 ? (
          <section className="inventory-empty">
            <h2>No products found</h2>
            <p>
              {selectedCategory
                ? `There are no products in ${selectedCategory}.`
                : "There are no products in your catalog yet."}
            </p>
          </section>
        ) : (
          <section className="inventory-grid" aria-label="Product inventory">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.has(product.id);

              return (
                <article
                  key={product.id}
                  className={`inventory-product-card${
                    isSelected ? " selected" : ""
                  }`}
                >
                  <div className="inventory-card-select">
                    <label>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                      Select
                    </label>
                  </div>

                  <div className="inventory-product-image-wrapper">
                    <img
                      className="inventory-product-image"
                      src={product.image}
                      alt={product.title}
                    />
                  </div>

                  <div className="inventory-product-content">
                    <span className="inventory-product-category">
                      {product.category}
                    </span>
                    <h2>{product.title}</h2>
                    <p className="inventory-product-description">
                      {product.description}
                    </p>
                    <p className="inventory-product-price">
                      ${Number(product.price).toFixed(2)}
                    </p>

                    <div className="inventory-card-actions">
                      <button
                        type="button"
                        className="inventory-edit-button"
                        onClick={() => {
                          setEditingProduct(product);
                          setMessage("");
                          setError("");
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="inventory-delete-button"
                        onClick={() => requestSingleDelete(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {deleteRequest && (
        <div
          className="inventory-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteRequest(null);
            }
          }}
        >
          <div
            className="inventory-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
          >
            <p className="inventory-eyebrow">Confirm deletion</p>
            <h2 id="delete-confirmation-title">
              {deleteRequest.type === "single"
                ? "Are you sure you want to delete this product?"
                : `Are you sure you want to delete ${deleteRequest.ids.length} selected product${
                    deleteRequest.ids.length === 1 ? "" : "s"
                  }?`}
            </h2>

            <p>
              {deleteRequest.type === "single"
                ? `“${deleteRequest.title}” will be permanently removed from the inventory.`
                : "The selected products will be permanently removed from the inventory."}
            </p>

            <div className="inventory-delete-modal-actions">
              <button
                type="button"
                className="inventory-secondary-button"
                disabled={isDeleting}
                onClick={() => setDeleteRequest(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="inventory-confirm-delete"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting
                  ? "Deleting…"
                  : deleteRequest.type === "single"
                    ? "Delete product"
                    : "Delete selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccessMessage && (
        <div className="inventory-delete-toast" role="status" aria-live="polite">
          <span className="inventory-delete-toast-icon" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Deleted successfully</strong>
            <span>{deleteSuccessMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
}

export default Inventory;
