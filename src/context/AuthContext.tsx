import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { startPresence } from '../services/presence';

interface AuthState {
  user: User | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsubAuth;
  }, []);

  // Bật online/offline khi đã đăng nhập, dọn dẹp khi đăng xuất
  useEffect(() => {
    if (!user) return;
    const stopPresence = startPresence(user.uid);
    return () => stopPresence();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
