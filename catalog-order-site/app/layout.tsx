import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartWidget from '@/components/CartWidget';

export const metadata: Metadata = {
  title: 'カタログ発注 | OSSTEM JAPAN',
  description: '営業向けカタログ発注サイト',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-ink antialiased">
        <CartProvider>
          <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-6">
              <a href="/" className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-brand-800">OSSTEM JAPAN</span>
                <span className="text-sm text-ink/60">カタログ発注</span>
              </a>
              <CartWidget />
            </div>
          </header>
          <main className="mx-auto max-w-content px-4 pb-16 pt-6 sm:px-6">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
