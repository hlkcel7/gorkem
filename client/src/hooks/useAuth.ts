import { useQuery } from "@tanstack/react-query";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { googleSheetsClient } from "@/services/googleSheets";
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
      // Also sign out from Google Sheets
      await googleSheetsClient.signOut();
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