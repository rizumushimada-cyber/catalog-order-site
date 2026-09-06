import { NextResponse } from 'next/server';
import { getBranchNames } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branches = await getBranchNames();
    return NextResponse.json({ branches });
  } catch (err) {
    console.error('GET /api/branches failed:', err);
    return NextResponse.json(
      { error: '現在サイトにアクセスできません。時間をおいて再度お試しください。' },
      { status: 500 }
    );
  }
}
