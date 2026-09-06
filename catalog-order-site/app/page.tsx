'use client';

import { useEffect, useState } from 'react';
import CatalogCard from '@/components/CatalogCard';
import type { CatalogViewModel } from '@/app/api/catalogs/route';

export default function CatalogListPage() {
  const [items, setItems] = useState<CatalogViewModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink">カタログ一覧</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CatalogCard key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
}
