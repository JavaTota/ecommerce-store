export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderProduct {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  quantity: number;
}

export type OrderStatus =
  | "submitted"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  products: OrderProduct[];
  totalItems: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date | null;
}
