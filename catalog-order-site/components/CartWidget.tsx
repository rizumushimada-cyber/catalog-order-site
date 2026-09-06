'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartWidget() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand-300"
    >
      <span aria-hidden>🛒</span>
      <span>カート（{itemCount}）</span>
    </Link>
  );
}
