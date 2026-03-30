"use client";

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

export default function Field({
  label,
  children,
}: Readonly<FieldProps>) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
      </label>
      {children}
    </div>
  );
}
