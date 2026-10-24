import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  createProduct,
  createProducts,
} from "../services/productService";
import {
  uploadProductImage,
  validateProductImage,
} from "../services/imageService";
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
  stock: 25,
};

function Products() {
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

    if (localPreview) URL.revokeObjectURL(localPreview);

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
      newProduct.price <= 0 ||
      !Number.isInteger(newProduct.stock) ||
      newProduct.stock < 0
    ) {
      setFormError(
        "Please complete every product field, enter a price above $0 and a valid whole-number stock quantity."
      );
      return;
    }

    if (imageMode === "url" && !newProduct.image.trim()) {
      setFormError("Enter an HTTPS image URL or choose Upload from computer.");
      return;
    }

    if (
      imageMode === "url" &&
      !newProduct.image.trim().startsWith("https://")
    ) {
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
        stock: newProduct.stock,
      });

      if (localPreview) URL.revokeObjectURL(localPreview);
      resetCreateForm();
      setFormMessage("Product created successfully. Open Inventory to review it.");
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

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setImportError("");
    setImportMessage("");
    setImportRows([]);
    setImportFileName("");

    if (!file) return;

    try {
      const rows = await parseProductImportFile(file);
      setImportRows(rows);
      setImportFileName(file.name);
    } catch (error) {
      console.error("Failed to parse product import file:", error);
      setImportError(
        error instanceof Error ? error.message : "The product file could not be read."
      );
      event.target.value = "";
    }
  };

  const handleBulkImport = async () => {
    setImportError("");
    setImportMessage("");

    if (importRows.length === 0) {
      setImportError("Choose a spreadsheet and review the preview first.");
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
      await createProducts(validImportRows.map((row) => row.product));
      setImportMessage(
        `${validImportRows.length} product${
          validImportRows.length === 1 ? "" : "s"
        } imported successfully. Open Inventory to review them.`
      );
      setImportRows([]);
      setImportFileName("");
    } catch (error) {
      console.error("Failed to import products:", error);
      setImportError(
        "The products could not be imported. Confirm you are signed in as an admin and that your Firestore rules allow product writes."
      );
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
            <p>Create products individually or import them in bulk.</p>
          </div>

          <Link className="secondary-button admin-header-link" to="/admin/inventory">
            View Inventory
          </Link>
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

            <div className="form-group">
              <label htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={newProduct.stock}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    stock: Math.max(0, Math.floor(Number(event.target.value) || 0)),
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

              <div className="image-source-options">
                <button
                  type="button"
                  className={`image-source-button ${
                    imageMode === "url" ? "selected" : ""
                  }`}
                  aria-pressed={imageMode === "url"}
                  onClick={() => switchImageMode("url")}
                >
                  <strong>Image URL</strong>
                  <span>Paste an existing HTTPS image address</span>
                </button>

                <button
                  type="button"
                  className={`image-source-button ${
                    imageMode === "upload" ? "selected" : ""
                  }`}
                  aria-pressed={imageMode === "upload"}
                  onClick={() => switchImageMode("upload")}
                >
                  <strong>Upload from computer</strong>
                  <span>JPG, PNG or WebP, up to 5 MB</span>
                </button>
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
                        setFormError(
                          "The image URL could not be loaded. Check the URL and try again."
                        );
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

        <section className="admin-card bulk-import-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-label">Bulk tools</p>
              <h2>Import products from a spreadsheet</h2>
              <p>
                Upload an Excel or CSV file, review every row, then import the
                valid products to Firestore in one action.
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
            <strong>Required columns:</strong> title, price, category,
            description, image. Optional stock defaults to 25. The image column
            must contain an HTTPS URL.
          </div>

          {importError && (
            <div className="admin-alert admin-alert-error" role="alert">
              <strong>Import not ready</strong>
              <span>{importError}</span>
            </div>
          )}

          {importMessage && (
            <div className="admin-alert admin-alert-success" role="status">
              <strong>Import complete</strong>
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

            <label htmlFor="product-file-import" className="image-upload-button">
              Choose Excel or CSV file
            </label>

            <div className="bulk-file-meta">
              <strong>{importFileName || "No spreadsheet selected"}</strong>
              <span>.xlsx, .xls or .csv · maximum 200 products per import</span>
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
                    invalidImportRows.length > 0 ? "import-summary-invalid" : ""
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
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.errors.length > 0 ? "import-row-invalid" : ""}
                      >
                        <td>{row.rowNumber}</td>
                        <td>
                          {row.errors.length === 0 ? (
                            <span className="row-status row-status-valid">Valid</span>
                          ) : (
                            <div className="row-error-list">
                              <span className="row-status row-status-invalid">
                                Invalid
                              </span>
                              {row.errors.map((error) => (
                                <small key={error}>{error}</small>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>{row.product.title || "—"}</td>
                        <td>
                          {Number.isFinite(row.product.price)
                            ? `$${row.product.price.toFixed(2)}`
                            : "—"}
                        </td>
                        <td>{row.product.category || "—"}</td>
                        <td className="import-description-cell">
                          {row.product.description || "—"}
                        </td>
                        <td>
                          {row.product.image ? (
                            <a
                              href={row.product.image}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Preview URL
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{row.product.stock}</td>
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
                    : `Import ${validImportRows.length} product${
                        validImportRows.length === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Products;
