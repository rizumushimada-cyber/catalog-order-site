import { NextResponse } from 'next/server';
import { getCatalogItems, getSheetsClient, SHEET_CATALOG } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export type CatalogViewModel = {
  productId: string;
  catalogName: string;
  imageUrl: string;
  orderUnit: number;
  // 発注できる最大数量（order_unit の倍数に切り下げ済み。在庫と1回上限の両方を満たす値）。
  // 在庫数そのものは画面側には送らない。
  maxOrderable: number;
  salesStatus: 'on_sale' | 'out_of_stock';
  nextArrivalDate: string;
  // 区分（catalog_master の J列 category）。空欄の場合は「その他」。
  category: string;
};

// catalog_master の J列(category)を product_id ごとに読み込む。
// 読み込みに失敗しても、カタログ一覧の表示自体は止めない（区分は「その他」になる）。
async function getCategoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return map;

  try {
    const res = await getSheetsClient().spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_CATALOG}!A2:J`,
    });
    for (const row of res.data.values ?? []) {
      if (row[0]) {
        map.set(String(row[0]), row[9] ? String(row[9]).trim() : '');
      }
    }
  } catch (err) {
    console.error('Failed to read category column:', err);
  }
  return map;
}

export async function GET() {
  try {
    const [items, categories] = await Promise.all([getCatalogItems(), getCategoryMap()]);

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
        category: categories.get(item.productId) || 'その他',
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
