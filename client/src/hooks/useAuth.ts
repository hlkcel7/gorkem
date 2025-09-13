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
      // Clear client-only session overrides so they don't persist beyond logout
      try {
        sessionStorage.removeItem('doc_search_enable_ai_override');
        // any other session-only keys used for live config
        sessionStorage.removeItem('doc_search_session_configs');
      } catch (e) {
        // ignore storage errors
      }
      try {
        // clear diagnostic tokens if we know the user id
        const currentUserId = auth?.currentUser?.uid;
        if (currentUserId) {
          // lazy-import to avoid circular import issues
          const mod = await import('../services/firebaseConfig');
          if (mod && typeof mod.clearLocalWriteToken === 'function') {
            mod.clearLocalWriteToken(currentUserId);
          }
        }
      } catch (e) {
        // ignore
      }
      console.log('Signed out from Firebase. Cleared session overrides and local tokens.');
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