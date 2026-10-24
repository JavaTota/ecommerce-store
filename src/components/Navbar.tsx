import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useAuth } from "../context/useAuth";
import "../styles/store.css";

function CustomerNavigation() {
  const cartItems = useSelector((state: RootState) => state.cart.cartItems);
  const totalQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const { user } = useAuth();

  return (
    <nav className="navbar-links" aria-label="Customer navigation">
      <Link className="nav-link" to="/">
        Shop
      </Link>

      {user ? (
        <>
          <Link className="nav-link" to="/orders">
            Orders
          </Link>
          <Link className="nav-link" to="/profile">
            Profile
          </Link>
          <Link className="nav-link" to="/logout">
            Logout
          </Link>
        </>
      ) : (
        <>
          <Link className="nav-link" to="/login">
            Login
          </Link>
          <Link className="nav-link" to="/register">
            Register
          </Link>
        </>
      )}

      <Link className="nav-link cart-link" to="/cart">
        Cart <span className="cart-count">{totalQuantity}</span>
      </Link>
    </nav>
  );
}

function AdminNavigation() {
  return (
    <nav className="navbar-links" aria-label="Admin navigation">
      <Link className="nav-link admin-nav-link" to="/admin/dashboard">
        Dashboard
      </Link>
      <Link className="nav-link admin-nav-link" to="/admin/inventory">
        Inventory
      </Link>
      <Link className="nav-link admin-nav-link" to="/admin/products">
        Product Management
      </Link>
      <Link className="nav-link admin-nav-link" to="/admin/orders">
        Orders
      </Link>
      <Link className="nav-link" to="/profile">
        Profile
      </Link>
      <Link className="nav-link" to="/logout">
        Logout
      </Link>
    </nav>
  );
}

function Navbar() {
  const { isAdmin, loading } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link
          className="navbar-brand"
          to={isAdmin ? "/admin/dashboard" : "/"}
        >
          Fake<span>Store</span>
        </Link>

        {loading ? (
          <nav className="navbar-links" aria-label="Loading navigation">
            <span className="nav-link">Loading…</span>
          </nav>
        ) : isAdmin ? (
          <AdminNavigation />
        ) : (
          <CustomerNavigation />
        )}
      </div>
    </header>
  );
}

export default Navbar;
