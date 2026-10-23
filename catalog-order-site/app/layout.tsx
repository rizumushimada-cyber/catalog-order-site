import type { Metadata } from 'next';
import Link from 'next/link';
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
      <body className="min-h-screen text-ink antialiased">
        <CartProvider>
          <header className="sticky top-0 z-40 bg-brand-800">
            <div className="mx-auto flex h-[60px] max-w-content items-center justify-between px-4 sm:h-[72px] sm:px-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="text-[15px] font-bold tracking-[0.05em] text-white sm:text-lg">
                  OSSTEM JAPAN
                </Link>
                <span className="h-4 w-px bg-white/35 sm:h-5" aria-hidden="true" />
                <span className="text-xs font-medium text-[#C9D6EB] sm:text-sm">カタログ発注</span>
              </div>
              <CartWidget />
            </div>
            <div className="h-[3px] bg-[#E0A93B]" />
          </header>
          <main className="mx-auto max-w-content px-4 pb-28 pt-6 sm:px-10 sm:pb-16 sm:pt-8">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
