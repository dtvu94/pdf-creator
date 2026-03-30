"use client";

type NumInputProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function NumInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step,
}: Readonly<NumInputProps>) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(+e.target.value)}
      className="input"
    />
  );
}
