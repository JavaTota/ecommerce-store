import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import type { CartItem, Order } from "../types/product";

export const createOrder = async (
  userId: string,
  cartItems: CartItem[]
): Promise<void> => {
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = Number(
    cartItems
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2)
  );

  await addDoc(collection(db, "orders"), {
    userId,
    products: cartItems,
    totalItems,
    totalPrice,
    status: "submitted",
    createdAt: serverTimestamp(),
  });
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<Order, "id">),
  }));
};
