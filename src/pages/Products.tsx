import { useEffect, useState } from "react";
import {
  getProductsFromFirestore,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../services/productService";
import type { Product } from "../types/product";

function Products() {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);

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
    const fetchProducts = async () => {
        const data = await getProductsFromFirestore();
        setProducts(data);
    };

    fetchProducts();
    }, []);

    const handleCreateProduct = async () => {
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

    return (
        <div>
        <h1>Products</h1>

        <h2>Add Product</h2>

        <input
            placeholder="Title"
            value={newProduct.title}
            onChange={(e) =>
            setNewProduct({
                ...newProduct,
                title: e.target.value,
            })
            }
        />

        <input
            placeholder="Price"
            type="number"
            value={newProduct.price}
            onChange={(e) =>
            setNewProduct({
                ...newProduct,
                price: Number(e.target.value),
            })
            }
        />

        <input
            placeholder="Category"
            value={newProduct.category}
            onChange={(e) =>
            setNewProduct({
                ...newProduct,
                category: e.target.value,
            })
            }
        />

        <input
            placeholder="Image URL"
            value={newProduct.image}
            onChange={(e) =>
            setNewProduct({
                ...newProduct,
                image: e.target.value,
            })
            }
        />

        <textarea
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) =>
            setNewProduct({
                ...newProduct,
                description: e.target.value,
            })
            }
        />

        <button onClick={handleCreateProduct}>
            Create Product
        </button>

        <hr />
        
        {editingProduct && (
            <div>
                <h2>Edit Product</h2>

                <input
                value={editingProduct.title}
                onChange={(e) =>
                    setEditingProduct({
                    ...editingProduct,
                    title: e.target.value,
                    })
                }
                />

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

                <button onClick={handleUpdateProduct}>
                Save Changes
                </button>
            </div>
        )}

        {products.map((product) => (
            <div key={product.id}>
            <h3>{product.title}</h3>

            <img
                src={product.image}
                alt={product.title}
                width={150}
            />

            <p>${product.price}</p>
            <p>{product.category}</p>

            <button
                onClick={() =>
                handleDeleteProduct(product.id)
                }
            >
                Delete
            </button>
            <button
                onClick={() =>
                setEditingProduct(product)
                }
            >
                Edit
            </button>

            </div>
        ))}
        </div>
    );
}

export default Products;