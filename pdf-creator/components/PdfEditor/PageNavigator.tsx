import type { TemplatePage, PageSize } from "@/types/template";
import PageThumbnail from "./PageThumbnail";

interface PageNavigatorProps {
  pages: TemplatePage[];
  activePage: number;
  pageSize?: PageSize;
  fontFamily: string;
  onSelectPage: (pi: number) => void;
  onAddPage: () => void;
  onDeletePage: (pi: number) => void;
  onDuplicatePage: (pi: number) => void;
  onMovePage: (pi: number, direction: "up" | "down") => void;
  onUpdateBookmark: (pi: number, bookmark: string) => void;
}

export default function PageNavigator({
  pages,
  activePage,
  pageSize,
  fontFamily,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onMovePage,
  onUpdateBookmark,
}: Readonly<PageNavigatorProps>) {
  return (
    <div className="page-nav">
      <span className="page-nav-title">
        Pages
      </span>

      {pages.map((page, pi) => (
        <div key={page.id} className="relative">
          <button
            type="button"
            onClick={() => onSelectPage(pi)}
            aria-label={`Go to page ${pi + 1}`}
            aria-pressed={pi === activePage}
            className="page-nav-thumb-btn"
            style={{
              border: `2px solid ${pi === activePage ? "#3B82F6" : "#334155"}`,
              outline: pi === activePage ? "1px solid #1D4ED8" : "none",
              outlineOffset: 1,
            }}
          >
            <PageThumbnail page={page} pageSize={pageSize} fontFamily={fontFamily} />
            <div
              className="page-nav-badge"
              style={{ background: pi === activePage ? "#3B82F6" : "rgba(0,0,0,0.5)" }}
            >
              {pi + 1}
            </div>
          </button>

          {/* Action buttons — shown on hover/active via CSS-in-JS or always for active page */}
          {pi === activePage && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  marginTop: 3,
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onMovePage(pi, "up"); }}
                  disabled={pi === 0}
                  title="Move page up"
                  aria-label={`Move page ${pi + 1} up`}
                  className="page-nav-action-btn"
                  style={{ opacity: pi === 0 ? 0.3 : 1 }}
                >
                  ▲
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMovePage(pi, "down"); }}
                  disabled={pi === pages.length - 1}
                  title="Move page down"
                  aria-label={`Move page ${pi + 1} down`}
                  className="page-nav-action-btn"
                  style={{ opacity: pi === pages.length - 1 ? 0.3 : 1 }}
                >
                  ▼
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicatePage(pi); }}
                  title="Duplicate page"
                  aria-label={`Duplicate page ${pi + 1}`}
                  className="page-nav-action-btn"
                >
                  ⧉
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePage(pi); }}
                    title="Delete page"
                    aria-label={`Delete page ${pi + 1}`}
                    className="page-nav-action-btn-delete"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                type="text"
                value={page.bookmark ?? ""}
                onChange={(e) => onUpdateBookmark(pi, e.target.value)}
                placeholder="Bookmark..."
                title="PDF bookmark label for this page"
                aria-label={`Bookmark for page ${pi + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="page-nav-bookmark"
              />
            </>
          )}
        </div>
      ))}

      <button
        onClick={onAddPage}
        className="page-nav-add-btn"
      >
        + Add
      </button>
    </div>
  );
}
