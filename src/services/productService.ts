import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import type { Product } from "../types/product";

const productsCollection = collection(db, "products");

export const getProductsFromFirestore = async (): Promise<Product[]> => {
    const snapshot = await getDocs(productsCollection);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Product[];
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