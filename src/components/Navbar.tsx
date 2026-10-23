import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useAuth } from "../context/AuthContext";
import "../styles/store.css";

function Navbar() {
  const cartItems = useSelector((state: RootState) => state.cart.cartItems);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const { user, isAdmin } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="navbar-brand" to="/">Fake<span>Store</span></Link>

        <nav className="navbar-links" aria-label="Main navigation">
          <Link className="nav-link" to="/">Shop</Link>

          {user ? (
            <>
              <Link className="nav-link" to="/profile">Profile</Link>
              {isAdmin && (
                <Link className="nav-link admin-nav-link" to="/admin/products">
                  Admin Panel
                </Link>
              )}
              <Link className="nav-link" to="/logout">Logout</Link>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/register">Register</Link>
            </>
          )}

          <Link className="nav-link cart-link" to="/cart">
            Cart <span className="cart-count">{totalQuantity}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
