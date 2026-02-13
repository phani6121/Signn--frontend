'use client';
 
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { languages } from '@/lib/translations';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getLocaleFromPathname, withLocale } from '@/i18n/config';
 
type Language = typeof languages[number]['code'];
 
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  languages: typeof languages;
}
 
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
 
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const fallbackLocale: Language = 'en';
  const languageAliases: Record<string, Language> = {
    english: 'en',
    hindi: 'hi',
    telugu: 'te',
    tamil: 'ta',
    marathi: 'mr',
    bengali: 'bn',
    bangla: 'bn',
    kannada: 'kn',
    odia: 'or',
    oriya: 'or',
    gujarati: 'gu',
    punjabi: 'pa',
    malayalam: 'ml',
    assamese: 'as',
    urdu: 'ur',
    rajasthani: 'raj',
  };

  const getStorageKey = (userId?: string | null) => {
    return userId ? `language:${userId}` : 'language';
  };

  const isSupportedLanguage = (value: unknown): value is Language => {
    return (
      typeof value === 'string' &&
      languages.some((item) => item.code === value)
    );
  };

  const normalizeLanguage = (value: unknown): Language | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    if (languages.some((item) => item.code === normalized)) {
      return normalized as Language;
    }

    const baseLocale = normalized.split('-')[0];
    if (languages.some((item) => item.code === baseLocale)) {
      return baseLocale as Language;
    }

    const matchedByName = languages.find(
      (item) => item.name.trim().toLowerCase() === normalized
    );
    if (matchedByName) {
      return matchedByName.code;
    }

    return languageAliases[normalized] ?? null;
  };
 
  useEffect(() => {
    const userId = user?.id || user?.username || null;
    const storedUserLang = normalizeLanguage(localStorage.getItem(getStorageKey(userId)));
    const storedGuestLang = normalizeLanguage(localStorage.getItem(getStorageKey(null)));
    const userLang = normalizeLanguage(user?.language);
    const nextLanguage =
      userLang ??
      storedUserLang ??
      storedGuestLang ??
      fallbackLocale;

    setLanguage(nextLanguage);

    if (userId) {
      localStorage.setItem(getStorageKey(userId), nextLanguage);
      // Keep backend preference aligned with resolved app language.
      persistUserLanguage(userId, nextLanguage);
    }
    localStorage.setItem(getStorageKey(null), nextLanguage);
  }, [user?.id, user?.username, user?.language]);
 
  const persistUserLanguage = async (userId: string, lang: Language) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/firebase/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
    } catch (error) {
      console.error('Failed to persist language preference:', error);
    }
  };
 
  const handleSetLanguage = (lang: Language) => {
    const nextLanguage = normalizeLanguage(lang) ?? fallbackLocale;
    setLanguage(nextLanguage);
    const userId = user?.id || user?.username || null;
    localStorage.setItem(getStorageKey(userId), nextLanguage);
    localStorage.setItem(getStorageKey(null), nextLanguage);
    if (userId) {
      // Always persist explicit language changes for logged-in users.
      persistUserLanguage(userId, nextLanguage);
      try {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          parsed.language = nextLanguage;
          sessionStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch (error) {
        console.error('Failed to update session storage language:', error);
      }
    }

    const currentLocale = getLocaleFromPathname(pathname);
    if (currentLocale !== nextLanguage) {
      const nextPath = withLocale(pathname, nextLanguage);
      const query = searchParams.toString();
      router.replace(query ? `${nextPath}?${query}` : nextPath);
    }
  };

  const resolvedLanguage = isSupportedLanguage(language)
    ? language
    : fallbackLocale;

  useEffect(() => {
    const localeFromPath = getLocaleFromPathname(pathname);
    if (localeFromPath !== resolvedLanguage) {
      const nextPath = withLocale(pathname, resolvedLanguage);
      const query = searchParams.toString();
      router.replace(query ? `${nextPath}?${query}` : nextPath);
    }
  }, [pathname, resolvedLanguage, router, searchParams]);

  const value = {
    language: resolvedLanguage,
    setLanguage: handleSetLanguage,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
 
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
