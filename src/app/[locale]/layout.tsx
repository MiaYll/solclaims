import WalletProviders from '@/components/walletproviders';
import InviteHandler from '@/components/InviteHandler';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import "../globals.css"

const locales = ['en', 'zh'];

type RootLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params: {locale}
}: {
  params: {locale: string}
}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'metadata'});
  return {
    title: {
      template: `%s | ${t('site.name')}`,
      default: t('site.name'),
    }
  };
}

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  if (!locales.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WalletProviders>
            <InviteHandler>
              {children}
            </InviteHandler>
          </WalletProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
