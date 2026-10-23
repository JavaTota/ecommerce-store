import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase/firebase";
import "../styles/auth-styles.css";


function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
      });

      setSuccess("Account created successfully!");
      navigate("/profile");
    } catch (error) {
      setError("Failed to create account.");
      console.error(error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

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
      </div>
    </div>
  );
}

export default Register;