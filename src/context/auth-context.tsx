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
import { getLocaleFromPathname, isLocale, stripLocalePrefix, withLocale } from '@/i18n/config';
 
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
  const locale = getLocaleFromPathname(pathname);
  const normalizedPathname = stripLocalePrefix(pathname);
 
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
 
    const pathIsAdmin = normalizedPathname.startsWith('/admin');
    const pathIsPublic = publicPaths.includes(normalizedPathname);
    let preferredLocale = locale;
    try {
      const stored = localStorage.getItem('language');
      if (isLocale(stored)) {
        preferredLocale = stored;
      }
    } catch {
      // Ignore storage access issues and keep locale from pathname.
    }
 
    // If no user, redirect to login unless on a public path
    if (!user && !pathIsPublic) {
      router.push(withLocale('/login', preferredLocale));
    }
    // If user is logged in...
    else if (user) {
      // if on a public path like /login, redirect
      if (pathIsPublic) {
        router.push(
          withLocale(user.id && user.id.startsWith('admin') ? '/admin' : '/', locale)
        );
      }
      // if a rider tries to access admin, redirect to rider dashboard
      else if (pathIsAdmin && !(user.id && user.id.startsWith('admin'))) {
        router.push(withLocale('/', locale));
      }
      // if an admin tries to access rider pages, redirect to admin dashboard
      else if (
        !pathIsAdmin &&
        normalizedPathname !== '/' &&
        user.id &&
        user.id.startsWith('admin')
      ) {
        router.push(withLocale('/admin', locale));
      }
    }
  }, [user, loading, locale, normalizedPathname, router]);
 
  // Legacy login method (used for admin login)
  const login = (role: 'rider' | 'admin' = 'rider', id?: string) => {
    if (role === 'admin') {
      sessionStorage.setItem('user', JSON.stringify(MOCK_ADMIN));
      setUser(MOCK_ADMIN);
      router.push(withLocale('/admin', locale));
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
      const result = await authenticateRider(
        username,
        password,
        language,
        userType
      );
     
      if (result.success && result.user) {
        const selectedLanguage =
          typeof language === 'string' && language.trim() ? language : undefined;
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          username: result.user.username,
          // Preserve currently selected UI language at login time.
          language: selectedLanguage ?? result.user.language,
          user_type:
            result.user.user_type === 'employee' || result.user.user_type === 'gig_worker'
              ? result.user.user_type
              : userType,
        };
        sessionStorage.setItem('user', JSON.stringify(userData));
        if (selectedLanguage) {
          try {
            localStorage.setItem(`language:${userData.id}`, selectedLanguage);
            localStorage.setItem('language', selectedLanguage);
            // Sync backend preference at login when user explicitly chooses a language.
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/firebase/users/${encodeURIComponent(userData.id)}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: selectedLanguage }),
              }
            ).catch(() => {});
          } catch {
            // Non-blocking persistence; auth flow should continue.
          }
        }
        setUser(userData);
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
    let preferredLocale = locale;
    try {
      const storedLocale = localStorage.getItem('language');
      if (isLocale(storedLocale)) {
        preferredLocale = storedLocale;
      } else if (typeof user?.language === 'string' && isLocale(user.language)) {
        preferredLocale = user.language;
      }
    } catch {
      if (typeof user?.language === 'string' && isLocale(user.language)) {
        preferredLocale = user.language;
      }
    }
    try {
      // Preserve current UI locale for the next login screen.
      localStorage.setItem('language', preferredLocale);
    } catch {
      // Ignore storage errors and proceed with logout.
    }
    sessionStorage.removeItem('user');
    setUser(null);
    router.push(withLocale('/login', preferredLocale));
  };
 
  const value = { user, login, loginWithCredentials, logout, loading };
 
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
 
  const pathIsAdmin = normalizedPathname.startsWith('/admin');
  const pathIsPublic = publicPaths.includes(normalizedPathname);
 
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
