import createMiddleware from 'next-intl/middleware';
import {DEFAULT_LOCALE, LOCALES} from './src/i18n/config';

export default createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
