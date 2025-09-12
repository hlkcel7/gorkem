import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, 
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      // Google Sheets client removed from client bundle; any server-side session
      // should be cleared there if needed.
      console.log('Signed out from Firebase. Google Sheets client deprecated on client.');
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signOut,
  };
}