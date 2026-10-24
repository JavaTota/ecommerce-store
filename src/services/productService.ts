import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import type { Product } from "../types/product";

const productsCollection = collection(db, "products");
const LEGACY_DEFAULT_STOCK = 25;

function normalizeProduct(id: string, data: DocumentData): Product {
  return {
    id,
    title: String(data.title ?? ""),
    price: Number(data.price ?? 0),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    image: String(data.image ?? ""),
    stock:
      Number.isInteger(data.stock) && data.stock >= 0
        ? Number(data.stock)
        : LEGACY_DEFAULT_STOCK,
  };
}

export const getProductsFromFirestore = async (): Promise<Product[]> => {
  const snapshot = await getDocs(productsCollection);

  return snapshot.docs.map((productDoc) =>
    normalizeProduct(productDoc.id, productDoc.data())
  );
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const productRef = doc(db, "products", id);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) return null;

  return normalizeProduct(snapshot.id, snapshot.data());
};

export const createProduct = async (
  product: Omit<Product, "id">
): Promise<void> => {
  await addDoc(productsCollection, product);
};

export const createProducts = async (
  products: Omit<Product, "id">[]
): Promise<void> => {
  if (products.length === 0) return;

  const batch = writeBatch(db);

  products.forEach((product) => {
    const productRef = doc(productsCollection);
    batch.set(productRef, product);
  });

  await batch.commit();
};

export const updateProduct = async (
  id: string,
  product: Partial<Omit<Product, "id">>
): Promise<void> => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, "products", id);
  await deleteDoc(productRef);
};

export const deleteProducts = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;

  const batchSize = 400;

  for (let start = 0; start < ids.length; start += batchSize) {
    const batch = writeBatch(db);
    const chunk = ids.slice(start, start + batchSize);

    chunk.forEach((id) => {
      batch.delete(doc(db, "products", id));
    });

    await batch.commit();
  }
};
