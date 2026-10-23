'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CatalogCard, { categoryColor } from '@/components/CatalogCard';
import { CartIcon } from '@/components/CartWidget';
import { useCart } from '@/context/CartContext';
import type { CatalogViewModel } from '@/app/api/catalogs/route';

const ALL = 'すべて';
// 表示する区分の順番。ここに無い区分（スプレッドシートで新しく作った区分）は最後に並ぶ。
const CATEGORY_ORDER = ['総合カタログ', '単品カタログ', 'リフレット', 'フライヤー', 'その他'];

export default function CatalogListPage() {
  const { items: cartItems, itemCount } = useCart();
  const [items, setItems] = useState<CatalogViewModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(ALL);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/catalogs')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'カタログの取得に失敗しました。');
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of items ?? []) {
      result[item.category] = (result[item.category] ?? 0) + 1;
    }
    return result;
  }, [items]);

  const categories = useMemo(() => {
    const present = Object.keys(counts);
    const ordered = CATEGORY_ORDER.filter((c) => present.includes(c));
    const extras = present.filter((c) => !CATEGORY_ORDER.includes(c)).sort();
    return [...ordered, ...extras];
  }, [counts]);

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-800">{error}</div>
    );
  }

  if (!items) {
    return <p className="py-16 text-center text-sm text-ink/50">読み込み中…</p>;
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-ink/50">現在ご案内できるカタログがありません。</p>;
  }

  const visible = selected === ALL ? items : items.filter((i) => i.category === selected);

  return (
    <div>
      <h1 className="sr-only">カタログ一覧</h1>

      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 whitespace-nowrap pb-1">
          {[ALL, ...categories].map((c) => {
            const active = selected === c;
            const count = c === ALL ? items.length : counts[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                aria-pressed={active}
                className={`flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] ${
                  active
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-[#D5DBE5] bg-white text-ink hover:border-brand-300'
                }`}
              >
                {c !== ALL && (
                  <i
                    className="h-2 w-2 rounded-full"
                    style={{ background: categoryColor(c) }}
                    aria-hidden="true"
                  />
                )}
                {c}
                <span className={`text-xs not-italic ${active ? 'text-[#C9D6EB]' : 'text-[#5B6676]'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
        {visible.map((item) => (
          <CatalogCard key={item.productId} item={item} />
        ))}
      </div>

      {cartItems.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-white px-4 pt-2.5 sm:hidden"
          style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2.5 text-brand-800">
            <CartIcon />
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E0A93B] px-1 text-xs font-bold text-ink">
              {cartItems.length}
            </span>
            <span className="text-[13px] font-medium">{itemCount}冊</span>
          </div>
          <Link
            href="/cart"
            className="flex h-11 items-center rounded-md bg-brand-700 px-7 text-[13px] font-medium text-white"
          >
            発注へ進む
          </Link>
        </div>
      )}
    </div>
  );
}
