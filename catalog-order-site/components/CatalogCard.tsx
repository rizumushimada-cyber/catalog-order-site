'use client';

import { useState } from 'react';
import Image from 'next/image';
import QuantitySelector from './QuantitySelector';
import { useCart } from '@/context/CartContext';
import type { CatalogViewModel } from '@/app/api/catalogs/route';

export default function CatalogCard({ item }: { item: CatalogViewModel }) {
  const { addItem } = useCart();
  const isOutOfStock = item.salesStatus === 'out_of_stock';
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : item.orderUnit);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(
      {
        productId: item.productId,
        catalogName: item.catalogName,
        imageUrl: item.imageUrl,
        orderUnit: item.orderUnit,
        maxQuantity: item.maxOrderable,
      },
      quantity
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded border border-line bg-white">
      <div className="relative aspect-[4/3] w-full bg-brand-50">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.catalogName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink/40">
            画像なし
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 px-3 py-2 text-white">
            <p className="text-sm font-semibold">❌ 欠品中</p>
            {item.nextArrivalDate && (
              <p className="text-xs text-white/80">次回入荷：{item.nextArrivalDate}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="text-base font-semibold leading-snug text-ink">{item.catalogName}</h2>
        <p className="text-xs text-ink/50">発注単位：{item.orderUnit}個</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <QuantitySelector
            quantity={quantity}
            orderUnit={item.orderUnit}
            min={item.orderUnit}
            max={item.maxOrderable}
            onChange={setQuantity}
            disabled={isOutOfStock}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:bg-ink/15 disabled:text-ink/40"
          >
            {added ? '追加しました' : 'カートに追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
