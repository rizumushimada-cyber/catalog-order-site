'use client';

import { useEffect, useMemo, useState } from 'react';
import CatalogCard from '@/components/CatalogCard';
import type { CatalogViewModel } from '@/app/api/catalogs/route';

const ALL = 'すべて';
// 表示する区分の順番。ここに無い区分（スプレッドシートで新しく作った区分）は最後に並ぶ。
const CATEGORY_ORDER = ['総合カタログ', '単品カタログ', 'リフレット', 'フライヤー', 'その他'];

export default function CatalogListPage() {
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
      <h1 className="mb-4 text-xl font-bold text-ink">カタログ一覧</h1>

      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 whitespace-nowrap pb-1">
          {[ALL, ...categories].map((c) => {
            const active = selected === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-white text-ink hover:border-brand-300'
                }`}
              >
                {c}
                <span className={`ml-1 text-xs ${active ? 'text-white/80' : 'text-ink/50'}`}>
                  {c === ALL ? items.length : counts[c]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((item) => (
          <CatalogCard key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
}
