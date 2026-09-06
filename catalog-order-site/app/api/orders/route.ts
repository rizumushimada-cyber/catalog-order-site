import { NextResponse } from 'next/server';
import { appendOrderHistory, getFreshStockQuantities, updateStockQuantity } from '@/lib/googleSheets';
import { withProductLocks } from '@/lib/orderLock';

export const dynamic = 'force-dynamic';

type OrderLineInput = {
  productId: string;
  catalogName: string;
  quantity: number;
};

type OrderRequestBody = {
  branchName: string;
  staffName: string;
  note?: string;
  items: OrderLineInput[];
};

function isValidBody(body: any): body is OrderRequestBody {
  return (
    body &&
    typeof body.branchName === 'string' &&
    body.branchName.trim().length > 0 &&
    typeof body.staffName === 'string' &&
    body.staffName.trim().length > 0 &&
    Array.isArray(body.items) &&
    body.items.length > 0 &&
    body.items.every(
      (i: any) =>
        typeof i.productId === 'string' &&
        typeof i.catalogName === 'string' &&
        typeof i.quantity === 'number' &&
        i.quantity > 0
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が正しくありません。' }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: '氏名・支店・商品情報が不足しています。入力内容をご確認ください。' },
      { status: 400 }
    );
  }

  const { branchName, staffName, note, items } = body;
  const productIds = items.map((i) => i.productId);

  try {
    const result = await withProductLocks(productIds, async () => {
      // Re-read the latest stock straight from the sheet — never trust the
      // value the client had when the page was loaded.
      const freshStock = await getFreshStockQuantities(productIds);

      const shortages: { catalogName: string; available: number }[] = [];
      for (const item of items) {
        const fresh = freshStock.get(item.productId);
        const available = fresh?.stockQuantity ?? 0;
        if (available < item.quantity) {
          shortages.push({ catalogName: item.catalogName, available });
        }
      }

      if (shortages.length > 0) {
        return { ok: false as const, shortages };
      }

      // All items sufficient — commit: decrement stock, then append history.
      for (const item of items) {
        const fresh = freshStock.get(item.productId)!;
        await updateStockQuantity(fresh.rowNumber, fresh.stockQuantity - item.quantity);
      }

      const orderDatetime = new Date().toISOString();
      await appendOrderHistory(
        items.map((item) => ({
          orderDatetime,
          branchName,
          staffName,
          productId: item.productId,
          catalogName: item.catalogName,
          quantity: item.quantity,
          note: note ?? '',
        }))
      );

      return { ok: true as const };
    });

    if (!result.ok) {
      const message = result.shortages
        .map((s) => `${s.catalogName} は在庫不足のため発注できませんでした（現在庫: ${s.available}）`)
        .join(' / ');
      return NextResponse.json({ error: message, shortages: result.shortages }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/orders failed:', err);
    return NextResponse.json(
      { error: '現在サイトにアクセスできません。時間をおいて再度お試しください。' },
      { status: 500 }
    );
  }
}
