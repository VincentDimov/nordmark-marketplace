import type { Metadata } from 'next';
import './globals.css';
import { ShopProvider } from '@/components/shop-provider';
import { Header, Footer } from '@/components/header';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Nordmark – hela din vardag på ett ställe', template: '%s | Nordmark' },
  description:
    'Upptäck hem, elektronik, mode och vardagsfavoriter på Nordmark. En komplett demonstrationsbutik med fem säljare och trygg simulerad checkout.',
  icons: { icon: '/icon.svg' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <ShopProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </ShopProvider>
      </body>
    </html>
  );
}
