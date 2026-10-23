'use client';

type Props = {
  quantity: number;
  orderUnit: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  fullWidth?: boolean;
};

export default function QuantitySelector({ quantity, orderUnit, min, max, onChange, disabled, fullWidth }: Props) {
  const canDecrease = !disabled && quantity - orderUnit >= min;
  const canIncrease = !disabled && quantity + orderUnit <= max;

  const buttonClass =
    'flex h-11 w-11 items-center justify-center rounded-[5px] bg-white text-lg text-brand-700 shadow-[0_1px_2px_rgba(20,48,92,0.18)] disabled:opacity-45';

  return (
    <div
      className={`flex h-[52px] items-center justify-between rounded-md bg-[#F1F5FB] px-1 text-[15px] font-medium text-brand-800 ${
        fullWidth ? 'w-full' : 'w-[152px]'
      }`}
    >
      <button
        type="button"
        aria-label="数量を減らす"
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, quantity - orderUnit))}
        className={buttonClass}
      >
        −
      </button>
      <span className="tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="数量を増やす"
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(max, quantity + orderUnit))}
        className={buttonClass}
      >
        ＋
      </button>
    </div>
  );
}
