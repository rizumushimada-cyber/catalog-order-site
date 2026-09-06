import { NextResponse } from 'next/server';
import { getCatalogItems } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export type CatalogViewModel = {
  productId: string;
  catalogName: string;
  imageUrl: string;
  orderUnit: number;
  // Largest orderable quantity (already floored to a multiple of orderUnit,
  // and capped by both stock_quantity and max_order_per_time).
  // Raw stock_quantity itself is intentionally never sent to the client.
  maxOrderable: number;
  salesStatus: 'on_sale' | 'out_of_stock';
  nextArrivalDate: string;
};

export async function GET() {
  try {
    const items = await getCatalogItems();

    const view: CatalogViewModel[] = items.map((item) => {
      const cap = Math.min(item.stockQuantity, item.maxOrderPerTime);
      const maxOrderable = item.orderUnit > 0 ? Math.floor(cap / item.orderUnit) * item.orderUnit : 0;

      return {
        productId: item.productId,
        catalogName: item.catalogName,
        imageUrl: item.imageUrl,
        orderUnit: item.orderUnit,
        maxOrderable: Math.max(maxOrderable, 0),
        salesStatus: item.salesStatus === 'out_of_stock' || maxOrderable <= 0 ? 'out_of_stock' : 'on_sale',
        nextArrivalDate: item.nextArrivalDate,
      };
    });

    return NextResponse.json({ items: view });
  } catch (err) {
    console.error('GET /api/catalogs failed:', err);
    return NextResponse.json(
      { error: '現在サイトにアクセスできません。時間をおいて再度お試しください。' },
      { status: 500 }
    );
  }
}
