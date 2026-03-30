import { TemplateInfo } from "@/lib/templates";
import PagePreview from "./PagePreview";

type TemplateCardProps = {
    info: TemplateInfo;
    onOpen: () => void;
};

export default function TemplateCard({ info, onOpen }: Readonly<TemplateCardProps>) {
  return (
    <div className="tpl-card tpl-card-border">
      {/* Preview strip */}
      <div
        className="tpl-card-preview-col"
        style={{ height: 120, background: info.accentColor }}
      >
        <PagePreview accentColor={info.accentColor} />
      </div>

      {/* Info */}
      <div className="tpl-card-content">
        <div className="flex-between">
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{info.name}</span>
        </div>
        <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, margin: 0, flex: 1 }}>
          {info.description}
        </p>
        <button
          onClick={onOpen}
          className="tpl-card-btn"
          style={{ background: info.accentColor, color: "#fff" }}
        >
          Open template
        </button>
      </div>
    </div>
  );
}
