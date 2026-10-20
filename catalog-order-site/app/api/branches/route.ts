import { NextResponse } from 'next/server';
import { getSheetsClient, SHEET_BRANCH } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export type BranchViewModel = {
  name: string;
  // 送付先の住所。branch_master の B列(address)・C列(address_2)から読み込む。
  // 空欄の列は含めない（0件 = 住所確認中、2件 = 利用者が選ぶ）。
  addresses: string[];
};

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('Missing required environment variable: GOOGLE_SHEET_ID');
    }

    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_BRANCH}!A2:C`,
    });

    const rows = res.data.values ?? [];
    const branches: BranchViewModel[] = rows
      .filter((row) => row[0])
      .map((row) => ({
        name: String(row[0]),
        addresses: [row[1], row[2]]
          .map((v) => (v ? String(v).trim() : ''))
          .filter((v) => v.length > 0),
      }));

    return NextResponse.json({ branches });
  } catch (err) {
    console.error('GET /api/branches failed:', err);
    return NextResponse.json(
      { error: '現在サイトにアクセスできません。時間をおいて再度お試しください。' },
      { status: 500 }
    );
  }
}
