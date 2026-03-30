"use client";

type ColorInputProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function ColorInput({
  value,
  onChange,
}: Readonly<ColorInputProps>) {
  return (
    <div className="color-input-wrap">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="color-swatch"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        style={{ flex: 1 }}
      />
    </div>
  );
}
