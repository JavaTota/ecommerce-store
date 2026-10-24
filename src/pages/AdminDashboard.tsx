import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllOrders } from "../services/orderService";
import { getProductsFromFirestore } from "../services/productService";
import type { Order, Product } from "../types/product";
import "../styles/dashboard.css";

function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, orderData] = await Promise.all([
          getProductsFromFirestore(),
          getAllOrders(),
        ]);
        setProducts(productData);
        setOrders(orderData);
      } catch (loadError) {
        console.error(loadError);
        setError("Dashboard data could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const metrics = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((total, order) => total + order.totalPrice, 0);
    const totalStock = products.reduce((total, product) => total + product.stock, 0);
    const lowStock = products.filter((product) => product.stock <= 5).length;

    return { revenue, totalStock, lowStock };
  }, [orders, products]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [products]
  );

  const statusCounts = useMemo(
    () =>
      orders.reduce<Record<string, number>>((result, order) => {
        result[order.status] = (result[order.status] ?? 0) + 1;
        return result;
      }, {}),
    [orders]
  );

  return (
    <main className="dashboard-page">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Store administration</p>
            <h1>Dashboard</h1>
            <p>A live operational view of catalog, inventory and orders.</p>
          </div>
        </header>

        {error && <div className="dashboard-alert">{error}</div>}

        {loading ? (
          <div className="dashboard-empty">Loading dashboard…</div>
        ) : (
          <>
            <section className="dashboard-metrics">
              <article><span>Revenue</span><strong>${metrics.revenue.toFixed(2)}</strong><small>Non-cancelled orders</small></article>
              <article><span>Orders</span><strong>{orders.length}</strong><small>All recorded orders</small></article>
              <article><span>Products</span><strong>{products.length}</strong><small>Catalog size</small></article>
              <article><span>Units in stock</span><strong>{metrics.totalStock}</strong><small>{metrics.lowStock} low-stock products</small></article>
            </section>

            <section className="dashboard-grid">
              <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div><h2>Order status</h2><p>Current fulfilment pipeline</p></div>
                  <Link to="/admin/orders">Manage orders</Link>
                </div>
                <div className="status-breakdown">
                  {["submitted", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                    <div key={status}>
                      <span>{status}</span>
                      <strong>{statusCounts[status] ?? 0}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div><h2>Low stock</h2><p>Products that may need attention</p></div>
                  <Link to="/admin/inventory">Open inventory</Link>
                </div>
                <div className="low-stock-list">
                  {lowStockProducts.length === 0 ? (
                    <p>No low-stock products.</p>
                  ) : lowStockProducts.map((product) => (
                    <div key={product.id}>
                      <img src={product.image} alt="" />
                      <span>{product.title}</span>
                      <strong>{product.stock}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
