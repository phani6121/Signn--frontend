import { translations } from '@/lib/translations';

export type Messages = Record<string, string>;

export function getMessagesForLocale(locale: string): Messages {
  const messages: Messages = {};
  for (const key of Object.keys(translations) as Array<keyof typeof translations>) {
    const entry = translations[key] as Record<string, string | undefined>;
    messages[key] = entry[locale] || entry.en || key;
  }
  return messages;
}
