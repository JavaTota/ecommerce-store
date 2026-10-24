import { useEffect, useState, type FormEvent } from "react";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/useAuth";
import { db } from "../lib/firebase/firebase";
import "../styles/auth-styles.css";

function getPasswordErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Your current password is incorrect.";

    case "auth/weak-password":
      return "Your new password is too weak. Please choose a stronger password.";

    case "auth/requires-recent-login":
      return "Please log out, sign back in, and try changing your password again.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";

    case "auth/network-request-failed":
      return "We couldn't connect to Firebase. Check your internet connection and try again.";

    default:
      return "Your password could not be changed. Please try again.";
  }
}

function Profile() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || "");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;

    void getDoc(doc(db, "users", user.uid)).then((snapshot) => {
      const data = snapshot.data();

      if (data?.name) setName(data.name);
      if (data?.address) setAddress(data.address);
    });
  }, [user]);

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError("No user is logged in.");
      return;
    }

    const cleanName = name.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setError("Name is required.");
      return;
    }

    try {
      await updateProfile(user, { displayName: cleanName });
      await updateDoc(doc(db, "users", user.uid), {
        name: cleanName,
        address: cleanAddress,
      });

      setName(cleanName);
      setAddress(cleanAddress);
      setMessage("Profile updated successfully.");
      setError("");
    } catch (updateError) {
      console.error("Error updating profile:", updateError);
      setMessage("");
      setError("Failed to update profile.");
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!user || !user.email) {
      setPasswordError("A password cannot be changed for this account.");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Your new password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Your new password must be different from your current password.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (passwordChangeError) {
      console.error("Error changing password:", passwordChangeError);

      if (passwordChangeError instanceof FirebaseError) {
        setPasswordError(
          getPasswordErrorMessage(passwordChangeError.code)
        );
      } else {
        setPasswordError("Your password could not be changed. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setError("No user is logged in.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete your account permanently? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
    } catch (deleteError) {
      console.error("Error deleting account:", deleteError);
      setError("Failed to delete account. Please log in again and retry.");
    }
  };

  return (
    <main className="auth-container profile-page">
      <div className="profile-sections">
        <section className="auth-card profile-card">
          <div className="profile-heading">
            <p className="eyebrow">Your account</p>
            <h1 className="auth-title">Profile</h1>
            <p>Keep your personal and delivery details up to date.</p>
          </div>

          {message && (
            <div className="auth-success-box" role="status">
              <strong>Profile updated</strong>
              <p>{message}</p>
            </div>
          )}

          {error && (
            <div className="auth-error-box" role="alert">
              <strong>Profile action failed</strong>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="auth-form">
            <label className="field-label" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              className="auth-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <label className="field-label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="auth-input"
              type="email"
              value={user?.email || ""}
              disabled
            />

            <label className="field-label" htmlFor="profile-address">
              Shipping address
            </label>
            <input
              id="profile-address"
              className="auth-input"
              type="text"
              placeholder="Street, city, state, ZIP"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />

            <button className="auth-button profile-primary-action" type="submit">
              Update profile
            </button>
          </form>
        </section>

        <section className="auth-card profile-card profile-security-card">
          <div className="profile-heading">
            <p className="eyebrow">Security</p>
            <h2 className="profile-section-title">Change password</h2>
            <p>Confirm your current password before setting a new one.</p>
          </div>

          {passwordMessage && (
            <div className="auth-success-box" role="status">
              <strong>Password updated</strong>
              <p>{passwordMessage}</p>
            </div>
          )}

          {passwordError && (
            <div className="auth-error-box" role="alert">
              <strong>Password not changed</strong>
              <p>{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="auth-form">
            <label className="field-label" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />

            <label className="field-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />

            <label className="field-label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button
              className="auth-button profile-primary-action"
              type="submit"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Changing password…" : "Change password"}
            </button>
          </form>

          <div className="profile-danger-zone">
            <div>
              <strong>Delete account</strong>
              <p>Permanently remove your account and profile information.</p>
            </div>

            <button
              className="danger-button"
              type="button"
              onClick={handleDeleteAccount}
            >
              Delete account
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
