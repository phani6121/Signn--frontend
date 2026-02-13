import {languages} from '@/lib/translations';

export const LOCALES = languages.map((item) => item.code);
export const DEFAULT_LOCALE = 'en';

export function isLocale(value: string | null | undefined): value is string {
  return !!value && LOCALES.includes(value);
}

export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (!isLocale(first)) {
    return pathname || '/';
  }

  const rest = segments.slice(1).join('/');
  return rest ? `/${rest}` : '/';
}

export function withLocale(pathname: string, locale: string): string {
  const targetLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const barePath = stripLocalePrefix(pathname);
  return barePath === '/' ? `/${targetLocale}` : `/${targetLocale}${barePath}`;
}
