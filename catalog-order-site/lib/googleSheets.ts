import { google, sheets_v4 } from 'googleapis';

export const SHEET_CATALOG = 'catalog_master';
export const SHEET_BRANCH = 'branch_master';
export const SHEET_ORDER = 'order_history';

export const CATALOG_RANGE = `${SHEET_CATALOG}!A2:I`;
export const BRANCH_RANGE = `${SHEET_BRANCH}!A2:A`;
export const ORDER_APPEND_RANGE = `${SHEET_ORDER}!A:G`;

export type SalesStatus = 'on_sale' | 'out_of_stock';

export type CatalogItem = {
  productId: string;
  catalogName: string;
  imageUrl: string;
  stockQuantity: number;
  orderUnit: number;
  maxOrderPerTime: number;
  nextArrivalDate: string;
  displayOrder: number;
  salesStatus: SalesStatus;
  rowNumber: number;
};

function computeSalesStatus(stockQuantity: number): SalesStatus {
  return stockQuantity <= 0 ? 'out_of_stock' : 'on_sale';
}

let cachedClient: sheets_v4.Sheets | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

function getSheetId(): string {
  return getEnv('GOOGLE_SHEET_ID');
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: CATALOG_RANGE,
  });

  const rows = res.data.values ?? [];
  const items: CatalogItem[] = [];
  const statusUpdates: { range: string; values: string[][] }[] = [];

  rows.forEach((row, idx) => {
    const [
      productId,
      catalogName,
      imageUrl,
      stockQuantityRaw,
      orderUnitRaw,
      maxOrderPerTimeRaw,
      nextArrivalDate,
      displayOrderRaw,
      existingStatus,
    ] = row;

    if (!productId) return;

    const stockQuantity = toNumber(stockQuantityRaw);
    const salesStatus = computeSalesStatus(stockQuantity);
    const rowNumber = idx + 2;

    if (existingStatus !== salesStatus) {
      statusUpdates.push({
        range: `${SHEET_CATALOG}!I${rowNumber}`,
        values: [[salesStatus]],
      });
    }

    items.push({
      productId: String(productId),
      catalogName: catalogName ?? '',
      imageUrl: imageUrl ?? '',
      stockQuantity,
      orderUnit: toNumber(orderUnitRaw, 1),
      maxOrderPerTime: toNumber(maxOrderPerTimeRaw, 0),
      nextArrivalDate: nextArrivalDate ?? '',
      displayOrder: toNumber(displayOrderRaw, 0),
      salesStatus,
      rowNumber,
    });
  });

  if (statusUpdates.length > 0) {
    sheets.spreadsheets.values
      .batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: 'RAW', data: statusUpdates },
      })
      .catch((err) => console.error('Failed to sync sales_status column:', err));
  }

  items.sort((a, b) => a.displayOrder - b.displayOrder);
  return items;
}

export async function getFreshStockQuantities(
  productIds: string[]
): Promise<Map<string, { stockQuantity: number; rowNumber: number }>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_CATALOG}!A2:D`,
  });

  const rows = res.data.values ?? [];
  const result = new Map<string, { stockQuantity: number; rowNumber: number }>();
  const wanted = new Set(productIds);

  rows.forEach((row, idx) => {
    const [productId, , , stockQuantityRaw] = row;
    if (productId && wanted.has(String(productId))) {
      result.set(String(productId), {
        stockQuantity: toNumber(stockQuantityRaw),
        rowNumber: idx + 2,
      });
    }
  });

  return result;
}

export async function updateStockQuantity(rowNumber: number, newQuantity: number): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `${SHEET_CATALOG}!D${rowNumber}`, values: [[newQuantity]] },
        { range: `${SHEET_CATALOG}!I${rowNumber}`, values: [[computeSalesStatus(newQuantity)]] },
      ],
    },
  });
}

export async function getBranchNames(): Promise<string[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: BRANCH_RANGE,
  });

  const rows = res.data.values ?? [];
  return rows.map((r) => r[0]).filter((v): v is string => Boolean(v));
}

export type OrderHistoryRow = {
  orderDatetime: string;
  branchName: string;
  staffName: string;
  productId: string;
  catalogName: string;
  quantity: number;
  note: string;
};

export async function appendOrderHistory(rows: OrderHistoryRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: ORDER_APPEND_RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rows.map((r) => [
        r.orderDatetime,
        r.branchName,
        r.staffName,
        r.productId,
        r.catalogName,
        r.quantity,
        r.note,
      ]),
    },
  });
}
