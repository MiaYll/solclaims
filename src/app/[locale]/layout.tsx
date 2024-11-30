import WalletProviders from '@/components/walletproviders';
import InviteHandler from '@/components/InviteHandler';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {Metadata} from 'next';
import { Analytics } from "@vercel/analytics/react"
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
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    },
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
    <html lang={locale} suppressHydrationWarning className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.7, maximum-scale=0.7, user-scalable=0" />
      </head>
      <body className="min-h-screen h-full w-full bg-black text-white overflow-x-hidden">
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-900/20 to-blue-900/20">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <WalletProviders>
              <InviteHandler>
                {children}
              </InviteHandler>
            </WalletProviders>
          </NextIntlClientProvider>
          <Analytics />
        </div>
      </body>
    </html>
  );
}
