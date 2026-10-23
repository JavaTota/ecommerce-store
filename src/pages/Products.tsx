import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  getProductsFromFirestore,
  createProduct,
  createProducts,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import {
  uploadProductImage,
  validateProductImage,
} from "../services/imageService";
import type { Product } from "../types/product";
import {
  downloadProductImportTemplate,
  parseProductImportFile,
  type ProductImportRow,
} from "../services/productImportService";
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

  const [importRows, setImportRows] = useState<ProductImportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const imagePreview = useMemo(() => {
    if (imageMode === "upload") return localPreview;

    return newProduct.image.trim();
  }, [imageMode, localPreview, newProduct.image]);

  const validImportRows = useMemo(
    () => importRows.filter((row) => row.errors.length === 0),
    [importRows]
  );

  const invalidImportRows = useMemo(
    () => importRows.filter((row) => row.errors.length > 0),
    [importRows]
  );

  const loadProducts = async () => {
    const data = await getProductsFromFirestore();

    setProducts(data);
  };

  useEffect(() => {
    let isActive = true;

    void getProductsFromFirestore().then((data) => {
      if (isActive) {
        setProducts(data);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
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
      setNewProduct((product) => ({
        ...product,
        image: "",
      }));
    }
  };

  const handleImageFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
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

    if (
      !title ||
      !category ||
      !description ||
      newProduct.price <= 0
    ) {
      setFormError(
        "Please complete every product field and enter a price above $0."
      );

      return;
    }

    if (imageMode === "url" && !newProduct.image.trim()) {
      setFormError(
        "Enter an HTTPS image URL or choose Upload from computer."
      );

      return;
    }

    if (
      imageMode === "url" &&
      !newProduct.image.trim().startsWith("https://")
    ) {
      setFormError(
        "Product image URLs must start with https://."
      );

      return;
    }

    if (imageMode === "upload" && !imageFile) {
      setFormError(
        "Choose an image from your computer before creating the product."
      );

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

  const handleImportFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setImportError("");
    setImportMessage("");
    setImportRows([]);
    setImportFileName("");

    if (!file) {
      return;
    }

    try {
      const rows = await parseProductImportFile(file);

      setImportRows(rows);
      setImportFileName(file.name);
    } catch (error) {
      console.error("Failed to parse product import file:", error);

      setImportError(
        error instanceof Error
          ? error.message
          : "The product file could not be read."
      );

      event.target.value = "";
    }
  };

  const handleBulkImport = async () => {
    setImportError("");
    setImportMessage("");

    if (importRows.length === 0) {
      setImportError(
        "Choose a spreadsheet and review the preview first."
      );

      return;
    }

    if (invalidImportRows.length > 0) {
      setImportError(
        `Fix the ${invalidImportRows.length} invalid row${
          invalidImportRows.length === 1 ? "" : "s"
        } before importing.`
      );

      return;
    }

    setIsImporting(true);

    try {
      await createProducts(
        validImportRows.map((row) => row.product)
      );

      setImportMessage(
        `${validImportRows.length} product${
          validImportRows.length === 1 ? "" : "s"
        } imported successfully.`
      );

      setImportRows([]);
      setImportFileName("");

      await loadProducts();
    } catch (error) {
      console.error("Failed to import products:", error);

      setImportError(
        "The products could not be imported. Confirm you are signed in as an admin and that your Firestore rules allow product writes."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    await deleteProduct(id);

    await loadProducts();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) {
      return;
    }

    await updateProduct(editingProduct.id, {
      title: editingProduct.title.trim(),
      price: Number(
        Number(editingProduct.price).toFixed(2)
      ),
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
            <p className="admin-label">
              Store administration
            </p>

            <h1>Product Management</h1>

            <p>
              Create, edit and manage the products available
              in your store.
            </p>
          </div>
        </div>

        {/* ADD PRODUCT */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Add product</h2>

              <p>
                Create a product using either an image URL or
                an image uploaded from your computer.
              </p>
            </div>
          </div>

          {formError && (
            <div
              className="admin-alert admin-alert-error"
              role="alert"
            >
              <strong>Product not saved</strong>

              <span>{formError}</span>
            </div>
          )}

          {formMessage && (
            <div
              className="admin-alert admin-alert-success"
              role="status"
            >
              <strong>Success</strong>

              <span>{formMessage}</span>
            </div>
          )}

          <div className="product-form">
            {/* TITLE */}
            <div className="form-group">
              <label htmlFor="product-title">
                Title
              </label>

              <input
                id="product-title"
                placeholder="Product name"
                value={newProduct.title}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    title: event.target.value,
                  })
                }
              />
            </div>

            {/* PRICE */}
            <div className="form-group">
              <label htmlFor="product-price">
                Price
              </label>

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

            {/* CATEGORY */}
            <div className="form-group form-group-full">
              <label htmlFor="product-category">
                Category
              </label>

              <input
                id="product-category"
                placeholder="e.g. electronics"
                value={newProduct.category}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    category: event.target.value,
                  })
                }
              />
            </div>

            {/* PRODUCT IMAGE */}
            <div className="form-group form-group-full image-source-section">
              <span className="form-label">
                Product image
              </span>

              {/* IMAGE SOURCE BUTTONS */}
              <div className="image-source-options">
                <button
                  type="button"
                  className={`image-source-button ${
                    imageMode === "url"
                      ? "selected"
                      : ""
                  }`}
                  aria-pressed={imageMode === "url"}
                  onClick={() =>
                    switchImageMode("url")
                  }
                >
                  <strong>Image URL</strong>

                  <span>
                    Paste an existing HTTPS image address
                  </span>
                </button>

                <button
                  type="button"
                  className={`image-source-button ${
                    imageMode === "upload"
                      ? "selected"
                      : ""
                  }`}
                  aria-pressed={imageMode === "upload"}
                  onClick={() =>
                    switchImageMode("upload")
                  }
                >
                  <strong>
                    Upload from computer
                  </strong>

                  <span>
                    JPG, PNG or WebP, up to 5 MB
                  </span>
                </button>
              </div>

              {/* URL MODE */}
              {imageMode === "url" ? (
                <div className="image-input-panel">
                  <label htmlFor="product-image-url">
                    Image URL
                  </label>

                  <input
                    id="product-image-url"
                    type="url"
                    placeholder="https://..."
                    value={newProduct.image}
                    onChange={(event) =>
                      setNewProduct({
                        ...newProduct,
                        image: event.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                /* UPLOAD MODE */
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
                    {imageFile
                      ? imageFile.name
                      : "No image selected"}
                  </span>
                </div>
              )}

              {/* IMAGE PREVIEW */}
              <div className="product-image-preview">
                <div className="preview-heading">
                  <strong>
                    Image preview
                  </strong>

                  <span>
                    Preview before saving the product
                  </span>
                </div>

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="New product preview"
                    onError={() => {
                      if (imageMode === "url") {
                        setFormError(
                          "The image URL could not be loaded. Check the URL and try again."
                        );
                      }
                    }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    Your selected product image will
                    appear here.
                  </div>
                )}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="form-group form-group-full">
              <label htmlFor="product-description">
                Description
              </label>

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
                {isSaving
                  ? "Creating…"
                  : "Create Product"}
              </button>
            </div>
          </div>
        </section>

        {/* BULK IMPORT */}
        <section className="admin-card bulk-import-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-label">
                Bulk tools
              </p>

              <h2>
                Import products from a spreadsheet
              </h2>

              <p>
                Upload an Excel or CSV file, review every
                row, then import the valid products to
                Firestore in one action.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={downloadProductImportTemplate}
            >
              Download template
            </button>
          </div>

          <div className="import-format-note">
            <strong>Required columns:</strong>{" "}
            title, price, category, description, image.
            The image column must contain an HTTPS URL.
          </div>

          {importError && (
            <div
              className="admin-alert admin-alert-error"
              role="alert"
            >
              <strong>
                Import not ready
              </strong>

              <span>{importError}</span>
            </div>
          )}

          {importMessage && (
            <div
              className="admin-alert admin-alert-success"
              role="status"
            >
              <strong>
                Import complete
              </strong>

              <span>{importMessage}</span>
            </div>
          )}

          <div className="bulk-upload-row">
            <input
              id="product-file-import"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={handleImportFileChange}
              hidden
            />

            <label
              htmlFor="product-file-import"
              className="image-upload-button"
            >
              Choose Excel or CSV file
            </label>

            <div className="bulk-file-meta">
              <strong>
                {importFileName ||
                  "No spreadsheet selected"}
              </strong>

              <span>
                .xlsx, .xls or .csv · maximum 200
                products per import
              </span>
            </div>
          </div>

          {importRows.length > 0 && (
            <>
              <div className="import-summary">
                <span className="import-summary-pill">
                  {importRows.length} rows found
                </span>

                <span className="import-summary-pill import-summary-valid">
                  {validImportRows.length} valid
                </span>

                <span
                  className={`import-summary-pill ${
                    invalidImportRows.length > 0
                      ? "import-summary-invalid"
                      : ""
                  }`}
                >
                  {invalidImportRows.length} invalid
                </span>
              </div>

              <div className="import-preview-wrapper">
                <table className="import-preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Status</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Image</th>
                    </tr>
                  </thead>

                  <tbody>
                    {importRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={
                          row.errors.length > 0
                            ? "import-row-invalid"
                            : ""
                        }
                      >
                        <td>
                          {row.rowNumber}
                        </td>

                        <td>
                          {row.errors.length === 0 ? (
                            <span className="row-status row-status-valid">
                              Valid
                            </span>
                          ) : (
                            <div className="row-error-list">
                              <span className="row-status row-status-invalid">
                                Invalid
                              </span>

                              {row.errors.map(
                                (error) => (
                                  <small key={error}>
                                    {error}
                                  </small>
                                )
                              )}
                            </div>
                          )}
                        </td>

                        <td>
                          {row.product.title ||
                            "—"}
                        </td>

                        <td>
                          {Number.isFinite(
                            row.product.price
                          )
                            ? `$${row.product.price.toFixed(
                                2
                              )}`
                            : "—"}
                        </td>

                        <td>
                          {row.product.category ||
                            "—"}
                        </td>

                        <td className="import-description-cell">
                          {row.product.description ||
                            "—"}
                        </td>

                        <td>
                          {row.product.image ? (
                            <a
                              href={
                                row.product.image
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Preview URL
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bulk-import-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    isImporting ||
                    validImportRows.length === 0 ||
                    invalidImportRows.length > 0
                  }
                  onClick={handleBulkImport}
                >
                  {isImporting
                    ? "Importing…"
                    : `Import ${
                        validImportRows.length
                      } product${
                        validImportRows.length ===
                        1
                          ? ""
                          : "s"
                      }`}
                </button>
              </div>
            </>
          )}
        </section>

        {/* EDIT PRODUCT */}
        {editingProduct && (
          <section className="admin-card edit-card">
            <div className="admin-card-header">
              <div>
                <h2>Edit product</h2>

                <p>
                  Update the selected product.
                </p>
              </div>

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setEditingProduct(null)
                }
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
                      price: Number(
                        event.target.value
                      ),
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
                      category:
                        event.target.value,
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
                <span className="form-label">
                  Current image preview
                </span>

                <img
                  src={editingProduct.image}
                  alt={editingProduct.title}
                />
              </div>

              <div className="form-group form-group-full">
                <label>Description</label>

                <textarea
                  value={
                    editingProduct.description
                  }
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      description:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleUpdateProduct
                  }
                >
                  Save Changes
                </button>
              </div>
            </div>
          </section>
        )}

        {/* INVENTORY */}
        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <h2>Inventory</h2>

              <p>
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="products-empty">
              <h3>No products yet</h3>

              <p>
                Use the form above to add your
                first product.
              </p>
            </div>
          ) : (
            <div className="admin-products-grid">
              {products.map((product) => (
                <article
                  className="admin-product-card"
                  key={product.id}
                >
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

                    <h3>
                      {product.title}
                    </h3>

                    <p className="admin-product-price">
                      $
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </p>

                    <div className="admin-product-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          setEditingProduct(
                            product
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDeleteProduct(
                            product.id
                          )
                        }
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