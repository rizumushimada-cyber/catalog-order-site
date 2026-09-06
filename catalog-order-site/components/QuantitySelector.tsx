'use client';

type Props = {
  quantity: number;
  orderUnit: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
};

export default function QuantitySelector({ quantity, orderUnit, min, max, onChange, disabled }: Props) {
  const canDecrease = !disabled && quantity - orderUnit >= min;
  const canIncrease = !disabled && quantity + orderUnit <= max;

  return (
    <div className="inline-flex items-center rounded border border-line">
      <button
        type="button"
        aria-label="数量を減らす"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, quantity - orderUnit))}
        className="flex h-9 w-9 items-center justify-center text-lg text-brand-700 disabled:text-ink/20"
      >
        −
      </button>
      <span className="min-w-[3rem] px-1 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="数量を増やす"
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, quantity + orderUnit))}
        className="flex h-9 w-9 items-center justify-center text-lg text-brand-700 disabled:text-ink/20"
      >
        ＋
      </button>
    </div>
  );
}
