import { createProduct } from "./productService";

const demoProducts = [
    {
        title: "Classic Backpack",
        price: 49.99,
        description:
            "A versatile everyday backpack with plenty of room for work, travel and daily essentials.",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    },
    {
        title: "Minimal Sneakers",
        price: 69.99,
        description:
            "Clean and comfortable everyday sneakers with a simple modern design.",
        category: "Shoes",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
    {
        title: "Wireless Headphones",
        price: 89.99,
        description:
            "Wireless over-ear headphones designed for music, work and travel.",
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    },
    {
        title: "Classic Watch",
        price: 119.99,
        description:
            "A minimal everyday watch with a timeless design and comfortable strap.",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
    {
        title: "Everyday Sunglasses",
        price: 39.99,
        description:
            "Lightweight sunglasses with a clean frame suitable for everyday wear.",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    },
    {
        title: "Essential T-Shirt",
        price: 24.99,
        description:
            "Soft everyday cotton T-shirt with a relaxed fit and minimal styling.",
        category: "Clothing",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    },
    {
        title: "Mechanical Keyboard",
        price: 79.99,
        description:
            "Compact mechanical keyboard designed for work, programming and gaming.",
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
    },
    {
        title: "Ceramic Mug",
        price: 18.99,
        description:
            "Minimal ceramic mug for coffee, tea and your daily desk setup.",
        category: "Home",
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d",
    },
    {
        title: "Desk Lamp",
        price: 44.99,
        description:
            "Modern desk lamp with a simple profile for home offices and workspaces.",
        category: "Home",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
    },
    {
        title: "Travel Camera",
        price: 299.99,
        description:
            "Compact camera designed for travel, street photography and everyday moments.",
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    },
    {
        title: "Leather Wallet",
        price: 34.99,
        description:
            "Slim wallet with space for essential cards and cash.",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93",
    },
    {
        title: "Running Shoes",
        price: 84.99,
        description:
            "Lightweight running shoes designed for comfort during everyday training.",
        category: "Shoes",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
];

export const seedProducts = async () => {
    for (const product of demoProducts) {
        await createProduct(product);
    }

    return demoProducts.length;
};