import { createProduct } from "./productService";

interface FakeStoreProduct {
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
}

export const seedProducts = async () => {
    const response = await fetch("https://fakestoreapi.com/products");

    if (!response.ok) {
        throw new Error("Failed to fetch products");
    }

    const products: FakeStoreProduct[] = await response.json();

    for (const product of products) {
        await createProduct({
            title: product.title,
            price: product.price,
            description: product.description,
            category: product.category,
            image: product.image,
        });
    }

    console.log(`${products.length} products added to Firestore`);
};