type BlankCardProps = {
  onOpen: () => void;
};

export default function BlankCard({ onOpen }: Readonly<BlankCardProps>) {
  return (
    <div className="tpl-card tpl-card-dashed">
      <div className="tpl-card-preview" style={{ height: 120, background: "#F8FAFC" }}>
        <span style={{ fontSize: 36, color: "#CBD5E1" }}>+</span>
      </div>
      <div className="tpl-card-content">
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Blank template</span>
        <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, margin: 0, flex: 1 }}>
          Start with an empty page and build your layout from scratch.
        </p>
        <button onClick={onOpen} className="tpl-card-btn-outline">
          Start blank
        </button>
      </div>
    </div>
  );
}
