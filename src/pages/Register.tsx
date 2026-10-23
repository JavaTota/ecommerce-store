import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Link, useNavigate } from "react-router-dom";

import { auth, db } from "../lib/firebase/firebase";
import "../styles/auth-styles.css";

function getRegisterErrorMessage(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email address.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Your password is too weak. Please choose a stronger password.";

    case "auth/network-request-failed":
      return "We couldn't connect to the server. Check your internet connection and try again.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";

    default:
      return "We couldn't create your account. Please try again.";
  }
}

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Name is required.");
      return;
    }

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    let createdUser: User | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      createdUser = userCredential.user;

      await updateProfile(createdUser, {
        displayName: cleanName,
      });

      await setDoc(doc(db, "users", createdUser.uid), {
        uid: createdUser.uid,
        name: cleanName,
        email: createdUser.email,
        createdAt: serverTimestamp(),
      });

      navigate("/profile");
    } catch (error) {
      console.error(error);

      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (rollbackError) {
          console.error("Failed to roll back user:", rollbackError);
        }
      }

      if (error instanceof FirebaseError) {
        setError(getRegisterErrorMessage(error.code));
      } else {
        setError("We couldn't create your account. Please try again.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>

        {error && (
          <div className="auth-error-box">
            <strong>Account not created</strong>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <input
            className="auth-input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            Register
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;