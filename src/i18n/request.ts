import {getRequestConfig} from 'next-intl/server';
import {DEFAULT_LOCALE, isLocale} from '@/i18n/config';
import {getMessagesForLocale} from '@/lib/i18n';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return {
    locale,
    messages: getMessagesForLocale(locale)
  };
});
