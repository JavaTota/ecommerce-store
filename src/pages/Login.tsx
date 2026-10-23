import { useEffect, useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Link, useNavigate } from "react-router-dom";

import { auth } from "../lib/firebase/firebase";
import { useAuth } from "../context/AuthContext";
import "../styles/auth-styles.css";

function getLoginErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-credential":
      return "The email or password you entered is incorrect.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/too-many-requests":
      return "Too many login attempts. Please wait a moment and try again.";

    case "auth/network-request-failed":
      return "We couldn't connect to the server. Check your internet connection and try again.";

    default:
      return "We couldn't log you in. Please try again.";
  }
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);

      navigate("/");
    } catch (error) {
      console.error("Error logging in user:", error);

      if (error instanceof FirebaseError) {
        setError(getLoginErrorMessage(error.code));
      } else {
        setError("We couldn't log you in. Please try again.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>

        {error && (
          <div className="auth-error-box">
            <strong>Login failed</strong>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-secondary-link">
            Forgot your password?
          </Link>

          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;