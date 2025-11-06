
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { auth } from '../firebaseConfig';
// FIX: Refactor to Firebase v8 namespaced API to resolve module import errors.
// Corrected: Use compat imports for Firebase v8 API compatibility.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface AuthContextType {
  // FIX: Use firebase.User type from the v8 SDK.
  firebaseUser: firebase.User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Use the v8 namespaced API for onAuthStateChanged.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (err: any) => {
    setError('An unexpected error occurred. Please try again.');
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Use the v8 namespaced API for signInWithEmailAndPassword.
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    // FIX: Use the v8 namespaced API for signOut.
    await auth.signOut();
  };

  const value = useMemo(() => ({
    firebaseUser,
    loading,
    error,
    login,
    logout,
  }), [firebaseUser, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};