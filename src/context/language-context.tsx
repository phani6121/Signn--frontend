'use client';
 
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { languages } from '@/lib/translations';
import { getMessagesForLocale } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
 
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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
 
  const getStorageKey = (userId?: string | null) => {
    return userId ? `language:${userId}` : 'language';
  };
 
  useEffect(() => {
    const userId = user?.id || user?.username || null;
    const storedLang = localStorage.getItem(getStorageKey(userId)) as Language;
    const preferredLang = (user?.language as Language) || storedLang;
    if (preferredLang && languages.find(l => l.code === preferredLang)) {
      setLanguage(preferredLang);
    }
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
    setLanguage(lang);
    const userId = user?.id || user?.username || null;
    localStorage.setItem(getStorageKey(userId), lang);
    if (userId) {
      if (!user?.language) {
        persistUserLanguage(userId, lang);
      }
      try {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          if (!parsed.language) {
            parsed.language = lang;
          }
          sessionStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch (error) {
        console.error('Failed to update session storage language:', error);
      }
    }
  };
 
  const messages = useMemo(() => getMessagesForLocale(language), [language]);
  const value = { language, setLanguage: handleSetLanguage, languages };
 
  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={language} messages={messages}>
        {children}
      </NextIntlClientProvider>
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
