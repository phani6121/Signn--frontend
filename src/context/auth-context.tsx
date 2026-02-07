'use client';
 
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authenticateRider, type AuthResult } from '@/app/actions';
 
// Mock admin user data (admin login remains unchanged)
const MOCK_ADMIN = {
  id: 'admin-001',
  name: 'Admin',
  email: 'admin@signn.com',
  username: 'admin',
};
 
type User = {
  id: string;
  name: string;
  email: string;
  username?: string;
  serial_number?: string;
  language?: string;
  user_type?: 'employee' | 'gig_worker';
} | null;
 
interface AuthContextType {
  user: User;
  login: (role?: 'rider' | 'admin', id?: string) => void;
  loginWithCredentials: (
    username: string,
    password: string,
    language?: string,
    userType?: 'employee' | 'gig_worker'
  ) => Promise<AuthResult>;
  logout: () => void;
  loading: boolean;
}
 
const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
 
  const publicPaths = ['/login'];
 
  useEffect(() => {
    // Check for a logged-in user from session storage
    try {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error('Could not access session storage:', error);
    }
    setLoading(false);
  }, []);
 
  useEffect(() => {
    if (loading) return;
 
    const pathIsAdmin = pathname.startsWith('/admin');
    const pathIsPublic = publicPaths.includes(pathname);
 
    // If no user, redirect to login unless on a public path
    if (!user && !pathIsPublic) {
      router.push('/login');
    }
    // If user is logged in...
    else if (user) {
      // if on a public path like /login, redirect
      if (pathIsPublic) {
        router.push(user.id && user.id.startsWith('admin') ? '/admin' : '/');
      }
      // if a rider tries to access admin, redirect to rider dashboard
      else if (pathIsAdmin && !(user.id && user.id.startsWith('admin'))) {
        router.push('/');
      }
      // if an admin tries to access rider pages, redirect to admin dashboard
      else if (!pathIsAdmin && pathname !== '/' && user.id && user.id.startsWith('admin')) {
        router.push('/admin');
      }
    }
  }, [user, loading, pathname, router]);
 
  // Legacy login method (used for admin login)
  const login = (role: 'rider' | 'admin' = 'rider', id?: string) => {
    if (role === 'admin') {
      sessionStorage.setItem('user', JSON.stringify(MOCK_ADMIN));
      setUser(MOCK_ADMIN);
      router.push('/admin');
    }
  };
 
  // New login method with username/password authentication via Firestore
  const loginWithCredentials = async (
    username: string,
    password: string,
    language?: string,
    userType?: 'employee' | 'gig_worker'
  ): Promise<AuthResult> => {
    try {
      const result = await authenticateRider(username, password, language);
     
      if (result.success && result.user) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          username: result.user.username,
          language: result.user.language,
          user_type: userType,
        };
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        router.push('/');
      }
     
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  };
 
  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };
 
  const value = { user, login, loginWithCredentials, logout, loading };
 
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
 
  const pathIsAdmin = pathname.startsWith('/admin');
  const pathIsPublic = publicPaths.includes(pathname);
 
  // More robust rendering logic
  if (!loading) {
    // Allow public pages if not logged in
    if (!user && pathIsPublic) {
      return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      );
    }
    // If user is logged in, check roles
    if (user) {
      const isAdmin = user.id && user.id.startsWith('admin');
      if (isAdmin && (pathIsAdmin || pathIsPublic)) {
        return (
          <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        );
      }
      // Allow riders (any user that's not admin) to access non-admin pages
      if (!isAdmin && !pathIsAdmin) {
        return (
          <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        );
      }
    }
  }
 
  // Render loading or nothing while redirects are in flight
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
 
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
