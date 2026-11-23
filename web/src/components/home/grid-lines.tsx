/**
 * The home page's visible 12-column grid as real hairlines (13: every
 * column start plus the right edge), so the page-load can draw them in one
 * by one. Other pages draw the same grid with .pm-page::before.
 */
export default function GridLines() {
  return (
    <div className="pm-grid" aria-hidden="true">
      <div className="pm-wrap pm-grid-inner">
        {Array.from({ length: 13 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i }} />
        ))}
      </div>
    </div>
  );
}
