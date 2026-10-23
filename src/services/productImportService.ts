import { read, utils } from "xlsx";
import type { Product } from "../types/product";

export type ProductDraft = Omit<Product, "id">;

export interface ProductImportRow {
  rowNumber: number;
  product: ProductDraft;
  errors: string[];
}

const MAX_IMPORT_ROWS = 200;
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const HEADER_ALIASES: Record<keyof ProductDraft, string[]> = {
  title: ["title", "name", "product", "productname", "producttitle"],
  price: ["price", "usdprice", "cost"],
  category: ["category", "type", "department"],
  description: ["description", "desc", "details"],
  image: ["image", "imageurl", "image_url", "photo", "photourl", "url"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeRecord(record: Record<string, unknown>) {
  return Object.entries(record).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      result[normalizeHeader(key)] = value;
      return result;
    },
    {}
  );
}

function getValue(
  record: Record<string, unknown>,
  field: keyof ProductDraft
): unknown {
  const aliases = HEADER_ALIASES[field].map(normalizeHeader);

  for (const alias of aliases) {
    if (alias in record) return record[alias];
  }

  return "";
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asPrice(value: unknown): number {
  if (typeof value === "number") return value;

  const cleaned = asString(value).replace(/[$,]/g, "");
  return Number(cleaned);
}

function validateProduct(product: ProductDraft): string[] {
  const errors: string[] = [];

  if (!product.title || product.title.length > 150) {
    errors.push("Title is required and must be 150 characters or fewer.");
  }

  if (!product.category || product.category.length > 80) {
    errors.push("Category is required and must be 80 characters or fewer.");
  }

  if (!product.description || product.description.length > 2000) {
    errors.push("Description is required and must be 2,000 characters or fewer.");
  }

  if (
    !product.image ||
    product.image.length > 2048 ||
    !product.image.startsWith("https://")
  ) {
    errors.push("Image must be a valid HTTPS URL up to 2,048 characters.");
  }

  if (
    !Number.isFinite(product.price) ||
    product.price < 0.01 ||
    product.price > 1_000_000 ||
    Math.round(product.price * 100) / 100 !== product.price
  ) {
    errors.push("Price must be between $0.01 and $1,000,000 with at most 2 decimals.");
  }

  return errors;
}

export function isSupportedProductFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function parseProductImportFile(
  file: File
): Promise<ProductImportRow[]> {
  if (!isSupportedProductFile(file)) {
    throw new Error("Choose an Excel (.xlsx/.xls) or CSV (.csv) file.");
  }

  const data = await file.arrayBuffer();
  const workbook = read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The spreadsheet does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: true,
  });

  if (rawRows.length === 0) {
    throw new Error("The spreadsheet does not contain any product rows.");
  }

  if (rawRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `Import up to ${MAX_IMPORT_ROWS} products at a time. This file contains ${rawRows.length}.`
    );
  }

  return rawRows.map((rawRow, index) => {
    const row = normalizeRecord(rawRow);
    const rawPrice = asPrice(getValue(row, "price"));

    const product: ProductDraft = {
      title: asString(getValue(row, "title")),
      price: Number.isFinite(rawPrice)
        ? Math.round(rawPrice * 100) / 100
        : Number.NaN,
      category: asString(getValue(row, "category")),
      description: asString(getValue(row, "description")),
      image: asString(getValue(row, "image")),
    };

    return {
      // +2 because spreadsheet row 1 is the header row.
      rowNumber: index + 2,
      product,
      errors: validateProduct(product),
    };
  });
}

export function downloadProductImportTemplate(): void {
  const csv = [
    ["title", "price", "category", "description", "image"],
    [
      "Urban Travel Backpack",
      "54.99",
      "Accessories",
      "Durable everyday backpack with padded straps and multiple storage compartments.",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    ],
  ]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "product-import-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
