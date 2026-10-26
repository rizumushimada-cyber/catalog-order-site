'use client';

import { useState } from 'react';
import Image from 'next/image';
import QuantitySelector from './QuantitySelector';
import { CartIcon } from './CartWidget';
import { useCart } from '@/context/CartContext';
import type { CatalogViewModel } from '@/app/api/catalogs/route';

// 区分ごとの色。カタログ名の左の線と、絞り込みボタンの丸の色に使う。
export const CATEGORY_COLORS: Record<string, string> = {
  総合カタログ: '#1A3B6E',
  単品カタログ: '#2F7F8F',
  リフレット: '#C58B2A',
  フライヤー: '#B5533C',
  その他: '#6B7585',
};

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#6B7585';
}

export default function CatalogCard({ item }: { item: CatalogViewModel }) {
  const { addItem } = useCart();
  const isOutOfStock = item.salesStatus === 'out_of_stock';
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : item.orderUnit);
  const [added, setAdded] = useState(false);
  const color = categoryColor(item.category);

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
    <div
      className="flex flex-col overflow-hidden rounded-md border border-line bg-white shadow-[0_1px_2px_rgba(20,48,92,0.06)] hover:shadow-[0_10px_24px_-10px_rgba(20,48,92,0.35)]"
    >
      <div className="cover-stage aspect-[3/4] w-full">
        <div className="absolute inset-x-[22px] bottom-[30px] top-[22px] flex items-center justify-center">
          <div className={`cover-book aspect-[5/7] h-full max-w-full ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
            <div className="relative flex-1 bg-white">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.catalogName}
                  fill
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 14vw"
                  className="object-contain"
                />
              ) : (
                <span className="block p-2 text-[11px] font-bold" style={{ color }}>
                  {item.catalogName}
                </span>
              )}
            </div>
          </div>
        </div>
        {isOutOfStock && (
          <span className="absolute left-[-34px] top-[26px] z-[2] w-[140px] -rotate-[35deg] bg-ink py-1 text-center text-[11px] text-white">
            欠品中
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <h2
          className="line-clamp-2 min-h-[42px] border-l-4 pl-2.5 text-sm font-medium leading-normal text-ink"
          style={{ borderLeftColor: color }}
        >
          {item.catalogName}
        </h2>
        <p className="pl-3.5 text-xs text-[#5B6676]">
          {isOutOfStock ? `次回入荷：${item.nextArrivalDate || '未定'}` : `発注単位 ${item.orderUnit}冊`}
        </p>

        <div className="mt-auto flex flex-col gap-2.5">
          <QuantitySelector
            fullWidth
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
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-700 text-[13px] font-medium text-white hover:bg-brand-600 disabled:bg-[#E8ECF2] disabled:text-[#5B6676] disabled:hover:bg-[#E8ECF2]"
          >
            <CartIcon />
            {added ? '追加しました' : 'カートに追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
