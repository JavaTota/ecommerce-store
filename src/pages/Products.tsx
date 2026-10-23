import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  getProductsFromFirestore,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import {
  uploadProductImage,
  validateProductImage,
} from "../services/imageService";
import type { Product } from "../types/product";
import "../styles/products.css";

type ImageMode = "url" | "upload";

const emptyProduct = {
  title: "",
  price: 0,
  description: "",
  category: "",
  image: "",
};

function Products() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState(emptyProduct);

  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const imagePreview = useMemo(() => {
    if (imageMode === "upload") return localPreview;
    return newProduct.image.trim();
  }, [imageMode, localPreview, newProduct.image]);

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
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const resetCreateForm = () => {
    setNewProduct(emptyProduct);
    setImageMode("url");
    setImageFile(null);
    setLocalPreview("");
  };

  const switchImageMode = (mode: ImageMode) => {
    setImageMode(mode);
    setFormError("");

    if (mode === "url") {
      setImageFile(null);
      setLocalPreview("");
    } else {
      setNewProduct((product) => ({ ...product, image: "" }));
    }
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFormError("");

    if (!file) {
      setImageFile(null);
      setLocalPreview("");
      return;
    }

    const validationError = validateProductImage(file);
    if (validationError) {
      setFormError(validationError);
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const handleCreateProduct = async () => {
    setFormError("");
    setFormMessage("");

    const title = newProduct.title.trim();
    const category = newProduct.category.trim();
    const description = newProduct.description.trim();

    if (!title || !category || !description || newProduct.price <= 0) {
      setFormError("Please complete every product field and enter a price above $0.");
      return;
    }

    if (imageMode === "url" && !newProduct.image.trim()) {
      setFormError("Enter an HTTPS image URL or choose Upload from computer.");
      return;
    }

    if (imageMode === "url" && !newProduct.image.trim().startsWith("https://")) {
      setFormError("Product image URLs must start with https://.");
      return;
    }

    if (imageMode === "upload" && !imageFile) {
      setFormError("Choose an image from your computer before creating the product.");
      return;
    }

    setIsSaving(true);

    try {
      const finalImageUrl =
        imageMode === "upload" && imageFile
          ? await uploadProductImage(imageFile)
          : newProduct.image.trim();

      await createProduct({
        title,
        price: Number(newProduct.price.toFixed(2)),
        description,
        category,
        image: finalImageUrl,
      });

      resetCreateForm();
      setFormMessage("Product created successfully.");
      await loadProducts();
    } catch (error) {
      console.error("Failed to create product:", error);
      setFormError(
        imageMode === "upload"
          ? "The product could not be created. If the image upload failed, confirm Firebase Storage is enabled and your Storage rules allow authenticated admins to upload."
          : "The product could not be created. Please check the product details and try again."
      );
    } finally {
      setIsSaving(false);
    }
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
      title: editingProduct.title.trim(),
      price: Number(Number(editingProduct.price).toFixed(2)),
      description: editingProduct.description.trim(),
      category: editingProduct.category.trim(),
      image: editingProduct.image.trim(),
    });

    setEditingProduct(null);
    await loadProducts();
  };

  return (
    <main className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <p className="admin-label">Store administration</p>
            <h1>Product Management</h1>
            <p>Create, edit and manage the products available in your store.</p>
          </div>
        </div>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Add product</h2>
              <p>
                Create a product using either an image URL or an image uploaded
                from your computer.
              </p>
            </div>
          </div>

          {formError && (
            <div className="admin-alert admin-alert-error" role="alert">
              <strong>Product not saved</strong>
              <span>{formError}</span>
            </div>
          )}

          {formMessage && (
            <div className="admin-alert admin-alert-success" role="status">
              <strong>Success</strong>
              <span>{formMessage}</span>
            </div>
          )}

          <div className="product-form">
            <div className="form-group">
              <label htmlFor="product-title">Title</label>
              <input
                id="product-title"
                placeholder="Product name"
                value={newProduct.title}
                onChange={(event) =>
                  setNewProduct({ ...newProduct, title: event.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="product-price">Price</label>
              <input
                id="product-price"
                placeholder="0.00"
                type="number"
                min="0.01"
                step="0.01"
                value={newProduct.price || ""}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    price: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="product-category">Category</label>
              <input
                id="product-category"
                placeholder="e.g. electronics"
                value={newProduct.category}
                onChange={(event) =>
                  setNewProduct({ ...newProduct, category: event.target.value })
                }
              />
            </div>

            <div className="form-group form-group-full image-source-section">
              <span className="form-label">Product image</span>

              <div className="image-source-options" role="radiogroup" aria-label="Image source">
                <label
                  className={`image-source-option ${
                    imageMode === "url" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="image-source"
                    checked={imageMode === "url"}
                    onChange={() => switchImageMode("url")}
                  />
                  <span>
                    <strong>Image URL</strong>
                    <small>Paste an existing HTTPS image address</small>
                  </span>
                </label>

                <label
                  className={`image-source-option ${
                    imageMode === "upload" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="image-source"
                    checked={imageMode === "upload"}
                    onChange={() => switchImageMode("upload")}
                  />
                  <span>
                    <strong>Upload from computer</strong>
                    <small>JPG, PNG or WebP, up to 5 MB</small>
                  </span>
                </label>
              </div>

              {imageMode === "url" ? (
                <div className="image-input-panel">
                  <label htmlFor="product-image-url">Image URL</label>
                  <input
                    id="product-image-url"
                    type="url"
                    placeholder="https://..."
                    value={newProduct.image}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, image: event.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="image-upload-area">
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    hidden
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="image-upload-button"
                  >
                    Choose image
                  </label>
                  <span className="selected-file-name">
                    {imageFile ? imageFile.name : "No image selected"}
                  </span>
                </div>
              )}

              <div className="product-image-preview">
                <div className="preview-heading">
                  <strong>Image preview</strong>
                  <span>Preview before saving the product</span>
                </div>

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="New product preview"
                    onError={() => {
                      if (imageMode === "url") {
                        setFormError("The image URL could not be loaded. Check the URL and try again.");
                      }
                    }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    Your selected product image will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                placeholder="Product description"
                value={newProduct.description}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    description: event.target.value,
                  })
                }
              />
            </div>

            <div className="form-actions">
              <button
                className="primary-button"
                type="button"
                disabled={isSaving}
                onClick={handleCreateProduct}
              >
                {isSaving ? "Creating…" : "Create Product"}
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
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
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

              <div className="form-group">
                <label>Category</label>
                <input
                  value={editingProduct.category}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
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

              <div className="form-group form-group-full edit-image-preview">
                <span className="form-label">Current image preview</span>
                <img src={editingProduct.image} alt={editingProduct.title} />
              </div>

              <div className="form-group form-group-full">
                <label>Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: event.target.value,
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
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="products-empty">
              <h3>No products yet</h3>
              <p>Use the form above to add your first product.</p>
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
