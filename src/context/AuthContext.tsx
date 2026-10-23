import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, getIdTokenResult, type User } from "firebase/auth";
import { auth } from "../lib/firebase/firebase";
import { AuthContext } from "./auth-context";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const token = await getIdTokenResult(currentUser, true);
        setIsAdmin(token.claims.admin === true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
