import { useEffect, useMemo, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../services/orderService";
import type { Order, OrderStatus } from "../types/product";
import "../styles/orders.css";

const ORDER_STATUSES: OrderStatus[] = [
  "submitted",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  const loadOrders = async () => {
    setOrders(await getAllOrders());
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadOrders();
      } catch (loadError) {
        console.error(loadError);
        setError("Orders could not be loaded. Confirm the admin Firestore rules are deployed.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return orders.filter((order) => {
      const statusMatches = !statusFilter || order.status === statusFilter;
      const searchMatches =
        !normalized ||
        order.id.toLowerCase().includes(normalized) ||
        order.customerEmail.toLowerCase().includes(normalized);
      return statusMatches && searchMatches;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setSavingId(orderId);
    setError("");
    setMessage("");

    try {
      await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
      setMessage("Order status updated successfully.");
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The order status could not be updated."
      );
    } finally {
      setSavingId("");
    }
  };

  return (
    <main className="orders-page admin-orders-page">
      <div className="container">
        <header className="orders-page-header admin-orders-header">
          <div>
            <p className="orders-eyebrow">Store administration</p>
            <h1>Orders</h1>
            <p>Review purchases and move orders through the fulfilment workflow.</p>
          </div>
        </header>

        {error && <div className="orders-alert orders-alert-error">{error}</div>}
        {message && <div className="orders-alert orders-alert-success">{message}</div>}

        <section className="orders-toolbar">
          <input
            type="search"
            placeholder="Search order ID or customer email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <span>{filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}</span>
        </section>

        {loading ? (
          <div className="orders-empty"><h2>Loading orders…</h2></div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty"><h2>No orders found</h2></div>
        ) : (
          <div className="admin-order-table-wrapper">
            <table className="admin-order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td>
                    <td>{order.customerEmail}</td>
                    <td>{order.totalItems}</td>
                    <td>${order.totalPrice.toFixed(2)}</td>
                    <td>{order.createdAt ? order.createdAt.toLocaleDateString() : "Pending"}</td>
                    <td>
                      <select
                        className={`order-status-select status-${order.status}`}
                        value={order.status}
                        disabled={savingId === order.id}
                        onChange={(event) =>
                          void handleStatusChange(order.id, event.target.value as OrderStatus)
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminOrders;
