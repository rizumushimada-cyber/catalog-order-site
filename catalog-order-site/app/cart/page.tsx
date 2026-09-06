'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QuantitySelector from '@/components/QuantitySelector';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [branches, setBranches] = useState<string[]>([]);
  const [branchName, setBranchName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [note, setNote] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ branch?: boolean; staff?: boolean }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => setBranches(data.branches ?? []))
      .catch(() => setBranches([]));
  }, []);

  const handleSubmit = async () => {
    const errors: { branch?: boolean; staff?: boolean } = {};
    if (!branchName) errors.branch = true;
    if (!staffName.trim()) errors.staff = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchName,
          staffName: staffName.trim(),
          note: note.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            catalogName: i.catalogName,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? '発注処理に失敗しました。');
        return;
      }

      clearCart();
      router.push('/order-complete');
    } catch {
      setSubmitError('現在サイトにアクセスできません。時間をおいて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink/50">カートに商品がありません。</p>
        <a href="/" className="mt-4 inline-block text-sm font-medium text-brand-600 underline">
          カタログ一覧に戻る
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-6 text-xl font-bold text-ink">カート</h1>
        <ul className="divide-y divide-line rounded border border-line">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-brand-50">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.catalogName} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.catalogName}</p>
                <p className="text-xs text-ink/50">発注単位：{item.orderUnit}個</p>
              </div>
              <QuantitySelector
                quantity={item.quantity}
                orderUnit={item.orderUnit}
                min={item.orderUnit}
                max={item.maxQuantity}
                onChange={(q) => updateQuantity(item.productId, q)}
              />
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-xs text-ink/40 underline hover:text-red-600"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded border border-line p-5">
        <h2 className="mb-4 text-base font-semibold text-ink">発注情報</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              支店（送付先） <span className="text-red-600">*</span>
            </label>
            <select
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className={`w-full rounded border px-3 py-2 text-sm ${
                fieldErrors.branch ? 'border-red-500' : 'border-line'
              }`}
            >
              <option value="">選択してください</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              氏名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="例：山田太郎"
              className={`w-full rounded border px-3 py-2 text-sm ${
                fieldErrors.staff ? 'border-red-500' : 'border-line'
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">備考（任意）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded border border-line px-3 py-2 text-sm"
            />
          </div>

          {submitError && (
            <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:bg-ink/20"
          >
            {submitting ? '処理中…' : '発注する'}
          </button>
        </div>
      </div>
    </div>
  );
}
