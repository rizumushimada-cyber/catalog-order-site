'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
    </svg>
  );
}

export default function CartWidget() {
  const { items } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`カート（${items.length}点）`}
      className="flex h-11 items-center gap-2 rounded-md bg-white px-3.5 text-[13px] font-medium text-brand-800"
    >
      <CartIcon />
      <span className="hidden sm:inline">カート</span>
      {items.length > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E0A93B] px-1 text-xs font-bold text-ink">
          {items.length}
        </span>
      )}
    </Link>
  );
}
