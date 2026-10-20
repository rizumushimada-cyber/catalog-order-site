import { NextResponse } from 'next/server';
import { getFreshStockQuantities, getSheetsClient, SHEET_ORDER, updateStockQuantity } from '@/lib/googleSheets';
import { withProductLocks } from '@/lib/orderLock';

export const dynamic = 'force-dynamic';

type OrderLineInput = {
  productId: string;
  catalogName: string;
  quantity: number;
};

type OrderRequestBody = {
  branchName: string;
  address?: string;
  staffName: string;
  note?: string;
  items: OrderLineInput[];
};

function isValidBody(body: any): body is OrderRequestBody {
  return (
    body &&
    typeof body.branchName === 'string' &&
    body.branchName.trim().length > 0 &&
    (body.address === undefined || typeof body.address === 'string') &&
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

// order_history の列: A 日時 | B 支店 | C 氏名 | D 商品ID | E カタログ名 | F 数量 | G 備考 | H 送付先住所
async function appendOrderRows(rows: (string | number)[][]) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing required environment variable: GOOGLE_SHEET_ID');
  }
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_ORDER}!A:H`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
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
  const address = (body.address ?? '').trim();
  const productIds = items.map((i) => i.productId);

  try {
    const result = await withProductLocks(productIds, async () => {
      // 画面表示時点の在庫ではなく、スプレッドシートの最新在庫を必ず再取得して確認する
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

      for (const item of items) {
        const fresh = freshStock.get(item.productId)!;
        await updateStockQuantity(fresh.rowNumber, fresh.stockQuantity - item.quantity);
      }

      const orderDatetime = new Date().toISOString();
      await appendOrderRows(
        items.map((item) => [
          orderDatetime,
          branchName,
          staffName,
          item.productId,
          item.catalogName,
          item.quantity,
          note ?? '',
          address,
        ])
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
