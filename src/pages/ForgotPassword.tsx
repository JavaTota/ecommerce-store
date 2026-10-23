import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase/firebase";
import "../styles/auth-styles.css";

function getResetErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "We couldn't connect to the server. Check your connection and try again.";
    default:
      return "We couldn't send the reset email. Please try again.";
  }
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setMessage(
        "If an account exists for that email, a password reset link has been sent."
      );
    } catch (error) {
      console.error("Password reset failed:", error);

      if (error instanceof FirebaseError) {
        setError(getResetErrorMessage(error.code));
      } else {
        setError("We couldn't send the reset email. Please try again.");
      }
    }
  };

  return (
    <main className="auth-container">
      <section className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-intro">
          Enter your account email and we'll send you a password reset link.
        </p>

        {error && (
          <div className="auth-error-box">
            <strong>Reset failed</strong>
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="auth-success-box">
            <strong>Check your email</strong>
            <p>{message}</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleReset}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button className="auth-button" type="submit">
            Send reset link
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </section>
    </main>
  );
}

export default ForgotPassword;
