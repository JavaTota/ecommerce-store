import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import Home from "./pages/Home.tsx";
import Cart from "./pages/Cart.tsx";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile.tsx";
import Logout from "./pages/Logout.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import Products from "./pages/Products.tsx";
import Inventory from "./pages/Inventory.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import CustomerRoute from "./components/CustomerRoute.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <CustomerRoute>
              <Home />
            </CustomerRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <CustomerRoute>
              <Cart />
            </CustomerRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <Inventory />
            </AdminRoute>
          }
        />

        <Route
          path="/products"
          element={<Navigate to="/admin/products" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
