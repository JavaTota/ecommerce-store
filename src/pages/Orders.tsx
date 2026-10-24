import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getUserOrders } from "../services/orderService";
import type { Order } from "../types/product";
import "../styles/orders.css";

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      try {
        setOrders(await getUserOrders(user.uid));
      } catch (loadError) {
        console.error("Failed to load orders:", loadError);
        setError("Your orders could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [user]);

  if (authLoading) return <div className="route-status">Checking access…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="orders-page">
      <div className="container">
        <header className="orders-page-header">
          <div>
            <p className="orders-eyebrow">Your account</p>
            <h1>Order history</h1>
            <p>Review previous purchases and follow their current status.</p>
          </div>
          <Link className="orders-secondary-link" to="/">Continue shopping</Link>
        </header>

        {error && <div className="orders-alert orders-alert-error">{error}</div>}

        {loading ? (
          <div className="orders-empty"><h2>Loading orders…</h2></div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <h2>No orders yet</h2>
            <p>Your completed checkouts will appear here.</p>
            <Link className="primary-button" to="/">Browse products</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="order-date">
                      {order.createdAt
                        ? order.createdAt.toLocaleString()
                        : "Processing timestamp"}
                    </span>
                  </div>
                  <span className={`order-status status-${order.status}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-products">
                  {order.products.map((product) => (
                    <div className="order-product" key={`${order.id}-${product.id}`}>
                      <img src={product.image} alt={product.title} />
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.quantity} × ${product.price.toFixed(2)}</span>
                      </div>
                      <span>${(product.quantity * product.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <span>{order.totalItems} item{order.totalItems === 1 ? "" : "s"}</span>
                  <strong>Total ${order.totalPrice.toFixed(2)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Orders;
