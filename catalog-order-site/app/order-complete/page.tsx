export default function OrderCompletePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">
        ✓
      </div>
      <h1 className="text-xl font-bold text-ink">発注が完了しました</h1>
      <p className="mt-2 text-sm text-ink/60">ご発注ありがとうございました。</p>
      <a
        href="/"
        className="mt-8 rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        カタログ一覧に戻る
      </a>
    </div>
  );
}
