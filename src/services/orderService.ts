import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../lib/firebase/firebase";
import type {
  CartItem,
  Order,
  OrderProduct,
  OrderStatus,
} from "../types/product";

const LEGACY_DEFAULT_STOCK = 25;

function toOrder(id: string, data: DocumentData): Order {
  const rawCreatedAt = data.createdAt;

  return {
    id,
    userId: String(data.userId ?? ""),
    customerEmail: String(data.customerEmail ?? "Legacy customer"),
    products: Array.isArray(data.products) ? data.products : [],
    totalItems: Number(data.totalItems ?? 0),
    totalPrice: Number(data.totalPrice ?? 0),
    status: (data.status ?? "submitted") as OrderStatus,
    createdAt:
      rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : null,
  };
}

function sortOrdersNewestFirst(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const aTime = a.createdAt?.getTime() ?? 0;
    const bTime = b.createdAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export const createOrder = async (
  user: User,
  cartItems: CartItem[]
): Promise<string> => {
  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  if (cartItems.length > 4) {
    throw new Error("This demo checkout supports up to 4 different products per order.");
  }

  const orderRef = doc(collection(db, "orders"));
  const productRefs = cartItems.map((item) => doc(db, "products", item.id));

  await runTransaction(db, async (transaction) => {
    // Firestore transactions require reads before writes.
    const snapshots = [];
    for (const productRef of productRefs) {
      snapshots.push(await transaction.get(productRef));
    }

    const orderProducts: OrderProduct[] = [];
    let totalItems = 0;
    let totalCents = 0;

    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) {
        throw new Error("A product in your cart is no longer available.");
      }

      const data = snapshot.data();
      const cartItem = cartItems[index];
      const currentStock =
        Number.isInteger(data.stock) && data.stock >= 0
          ? Number(data.stock)
          : LEGACY_DEFAULT_STOCK;

      if (cartItem.quantity < 1 || cartItem.quantity > 99) {
        throw new Error("Product quantities must be between 1 and 99.");
      }

      if (cartItem.quantity > currentStock) {
        throw new Error(
          `${String(data.title ?? cartItem.title)} only has ${currentStock} unit${
            currentStock === 1 ? "" : "s"
          } left in stock.`
        );
      }

      const price = Number(data.price ?? 0);
      const priceCents = Math.round(price * 100);
      const cartPriceCents = Math.round(Number(cartItem.price) * 100);

      if (priceCents !== cartPriceCents) {
        throw new Error(
          `${String(data.title ?? cartItem.title)} has a new price. Refresh the cart before checking out.`
        );
      }

      orderProducts.push({
        id: snapshot.id,
        title: String(data.title ?? ""),
        price: priceCents / 100,
        description: String(data.description ?? ""),
        category: String(data.category ?? ""),
        image: String(data.image ?? ""),
        quantity: cartItem.quantity,
      });

      totalItems += cartItem.quantity;
      totalCents += priceCents * cartItem.quantity;
    });

    snapshots.forEach((snapshot, index) => {
      const data = snapshot.data();
      const currentStock =
        Number.isInteger(data.stock) && data.stock >= 0
          ? Number(data.stock)
          : LEGACY_DEFAULT_STOCK;

      transaction.update(snapshot.ref, {
        stock: currentStock - cartItems[index].quantity,
      });
    });

    transaction.set(orderRef, {
      userId: user.uid,
      customerEmail: user.email ?? "",
      products: orderProducts,
      totalItems,
      totalPrice: totalCents / 100,
      status: "submitted",
      createdAt: serverTimestamp(),
    });
  });

  return orderRef.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(ordersQuery);

  return sortOrdersNewestFirst(
    snapshot.docs.map((document) => toOrder(document.id, document.data()))
  );
};

export const getAllOrders = async (): Promise<Order[]> => {
  const snapshot = await getDocs(collection(db, "orders"));

  return sortOrdersNewestFirst(
    snapshot.docs.map((document) => toOrder(document.id, document.data()))
  );
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  const orderRef = doc(db, "orders", orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("Order not found.");
    }

    const orderData = orderSnapshot.data();
    const currentStatus = (orderData.status ?? "submitted") as OrderStatus;

    if (currentStatus === status) return;

    const products = Array.isArray(orderData.products)
      ? (orderData.products as OrderProduct[])
      : [];

    const isCancelling = currentStatus !== "cancelled" && status === "cancelled";
    const isReactivating = currentStatus === "cancelled" && status !== "cancelled";

    if (isCancelling || isReactivating) {
      const productRefs = products.map((product) =>
        doc(db, "products", product.id)
      );
      const productSnapshots = [];

      for (const productRef of productRefs) {
        productSnapshots.push(await transaction.get(productRef));
      }

      productSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const currentStock =
          Number.isInteger(data.stock) && data.stock >= 0
            ? Number(data.stock)
            : LEGACY_DEFAULT_STOCK;
        const quantity = products[index].quantity;

        if (isReactivating && currentStock < quantity) {
          throw new Error(
            `${products[index].title} does not have enough stock to reactivate this order.`
          );
        }

        transaction.update(snapshot.ref, {
          stock: isCancelling
            ? currentStock + quantity
            : currentStock - quantity,
        });
      });
    }

    transaction.update(orderRef, { status });
  });
};
