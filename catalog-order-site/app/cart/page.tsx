'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QuantitySelector from '@/components/QuantitySelector';
import { useCart } from '@/context/CartContext';

type Branch = {
  name: string;
  addresses: string[];
};

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [staffName, setStaffName] = useState('');
  const [note, setNote] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ branch?: boolean; address?: boolean; staff?: boolean }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        const list: Branch[] = (data.branches ?? []).map((b: any) =>
          typeof b === 'string'
            ? { name: b, addresses: [] }
            : { name: String(b.name), addresses: Array.isArray(b.addresses) ? b.addresses : [] }
        );
        setBranches(list);
      })
      .catch(() => setBranches([]));
  }, []);

  const selectedBranch = branches.find((b) => b.name === branchName);
  const addresses = selectedBranch?.addresses ?? [];

  const handleBranchChange = (name: string) => {
    setBranchName(name);
    const branch = branches.find((b) => b.name === name);
    // 住所が1件ならそのまま確定、複数なら利用者に選んでもらう
    setAddress(branch && branch.addresses.length === 1 ? branch.addresses[0] : '');
  };

  const handleSubmit = async () => {
    const errors: { branch?: boolean; address?: boolean; staff?: boolean } = {};
    if (!branchName) errors.branch = true;
    if (addresses.length >= 2 && !address) errors.address = true;
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
          address,
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
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-6 text-xl font-bold text-ink">カート</h1>
        <ul className="divide-y divide-line rounded border border-line">
          {items.map((item) => (
            <li key={item.productId} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-brand-50">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.catalogName}
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.catalogName}</p>
                <p className="text-xs text-ink/50">発注単位：{item.orderUnit}冊</p>
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
              onChange={(e) => handleBranchChange(e.target.value)}
              className={`w-full rounded border px-3 py-2 text-sm ${
                fieldErrors.branch ? 'border-red-500' : 'border-line'
              }`}
            >
              <option value="">選択してください</option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {branchName && (
            <div>
              <p className="mb-1 text-sm font-medium text-ink">
                送付先住所
                {addresses.length >= 2 && <span className="text-red-600"> *</span>}
              </p>

              {addresses.length === 0 && (
                <p className="rounded border border-line bg-brand-50 px-3 py-2 text-sm text-ink/60">
                  この支店の住所は確認中です。
                </p>
              )}

              {addresses.length === 1 && (
                <p className="rounded border border-line bg-brand-50 px-3 py-2 text-sm leading-relaxed text-ink">
                  {addresses[0]}
                </p>
              )}

              {addresses.length >= 2 && (
                <div
                  className={`space-y-2 rounded border p-2 ${
                    fieldErrors.address ? 'border-red-500' : 'border-line'
                  }`}
                >
                  <p className="px-1 text-xs text-ink/60">送付先を選んでください</p>
                  {addresses.map((a) => (
                    <label
                      key={a}
                      className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-sm leading-relaxed ${
                        address === a ? 'border-brand-500 bg-brand-50' : 'border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={a}
                        checked={address === a}
                        onChange={() => setAddress(a)}
                        className="mt-1"
                      />
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

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
