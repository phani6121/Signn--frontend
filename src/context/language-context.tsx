'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, languages } from '@/lib/translations';

type Language = typeof languages[number]['code'];

type Translations = typeof translations;
type TranslationKey = keyof Translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && languages.find(l => l.code === storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };
  
  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  const value = { language, setLanguage: handleSetLanguage, t, languages };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
