import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import "../styles/auth-styles.css";

function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    void getDoc(doc(db, "users", user.uid)).then((snapshot) => {
      const data = snapshot.data();
      if (data?.name) setName(data.name);
      if (data?.address) setAddress(data.address);
    });
  }, [user]);

  const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return setError("No user is logged in.");

    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name, address });
      setMessage("Profile updated successfully.");
      setError("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return setError("No user is logged in.");
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account. Please log in again and retry.");
    }
  };

  return (
    <main className="auth-container profile-page">
      <section className="auth-card profile-card">
        <div className="profile-heading">
          <p className="eyebrow">Your account</p>
          <h1 className="auth-title">Profile</h1>
          <p>Keep your delivery details up to date.</p>
        </div>

        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleUpdateProfile} className="auth-form">
          <label className="field-label">Name</label>
          <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="field-label">Email</label>
          <input className="auth-input" type="email" value={user?.email || ""} disabled />

          <label className="field-label">Shipping address</label>
          <input className="auth-input" type="text" placeholder="Street, city, state, ZIP" value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="profile-actions">
            <button className="auth-button" type="submit">Update profile</button>
            <button className="danger-button" type="button" onClick={handleDeleteAccount}>Delete account</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Profile;
