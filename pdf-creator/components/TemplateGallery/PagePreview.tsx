type PagePreviewProps = {
  accentColor: string;
};

export default function PagePreview({ accentColor }: Readonly<PagePreviewProps>) {
  const line = (w: string, opacity: number, height: number, marginBottom: number) => (
    <div style={{ width: w, height, background: `rgba(255,255,255,${opacity})`, borderRadius: 2, marginBottom }} />
  );

  return (
    <div
      className="flex-col"
      style={{
        width: 70, background: "#fff", borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)", padding: "8px 7px",
      }}
    >
      <div style={{ width: "100%", height: 5, background: accentColor, borderRadius: 1, marginBottom: 6 }} />
      {line("60%", 1, 3, 4)}
      {line("80%", 0.5, 2, 3)}
      {line("80%", 0.5, 2, 3)}
      {line("80%", 0.5, 2, 3)}
      {line("50%", 0.3, 2, 0)}
    </div>
  );
}
