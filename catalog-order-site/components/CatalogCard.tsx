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
      <div className="relative aspect-[3/4] w-full bg-brand-50">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.catalogName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/40">
            画像なし
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 px-2 py-1.5 text-white">
            <p className="text-xs font-semibold">❌ 欠品中</p>
            {item.nextArrivalDate && (
              <p className="text-[11px] text-white/80">次回入荷：{item.nextArrivalDate}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
          {item.catalogName}
        </h2>
        <p className="text-[11px] text-ink/50">発注単位：{item.orderUnit}冊</p>

        <div className="mt-auto flex flex-col items-stretch gap-2 pt-1">
          <div className="flex justify-center">
            <QuantitySelector
              quantity={quantity}
              orderUnit={item.orderUnit}
              min={item.orderUnit}
              max={item.maxOrderable}
              onChange={setQuantity}
              disabled={isOutOfStock}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="w-full rounded bg-brand-600 px-2 py-2 text-xs font-medium text-white disabled:bg-ink/15 disabled:text-ink/40"
          >
            {added ? '追加しました' : 'カートに追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
