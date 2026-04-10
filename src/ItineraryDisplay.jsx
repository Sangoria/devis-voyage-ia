import React from "react";

/* ─── Inline markdown: **bold** ─────────────────────────────────────── */
function parseInline(text, seed = 0) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${seed}-b${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={`${seed}-t${i}`}>{part}</React.Fragment>
    )
  );
}

/* ─── Block renderer (lines → React nodes) ──────────────────────────── */
function renderLines(lines) {
  const out = [];
  let listBuf = [];
  let listOrdered = false;

  const flushList = (key) => {
    if (!listBuf.length) return;
    const Tag = listOrdered ? "ol" : "ul";
    out.push(
      <Tag key={`list-${key}`} className={`md-list ${listOrdered ? "ol" : "ul"}`}>
        {listBuf.map((item, j) => (
          <li key={j}>{parseInline(item, j)}</li>
        ))}
      </Tag>
    );
    listBuf = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();

    if (!line) {
      flushList(i);
      return;
    }

    /* Subheader: **Jour 1 : Tokyo** */
    const boldLine = line.match(/^\*\*(.+?)\*\*\s*:?\s*$/);
    if (boldLine) {
      flushList(i);
      out.push(<div key={i} className="md-subheader">{boldLine[1]}</div>);
      return;
    }

    /* Unordered list */
    const ulItem = line.match(/^[-*•]\s+(.+)/);
    if (ulItem) {
      if (listOrdered) flushList(i);
      listOrdered = false;
      listBuf.push(ulItem[1]);
      return;
    }

    /* Ordered sub-list (won't start with emoji, already caught as section) */
    const olItem = line.match(/^\d+[.)]\s+(.+)/);
    if (olItem && !/^\d+[.)]\s+\p{Emoji}/u.test(line)) {
      if (!listOrdered) flushList(i);
      listOrdered = true;
      listBuf.push(olItem[1]);
      return;
    }

    flushList(i);
    out.push(<p key={i} className="md-paragraph">{parseInline(line, i)}</p>);
  });

  flushList(lines.length);
  return out;
}

/* ─── Section colours ────────────────────────────────────────────────── */
const PALETTES = [
  { accent: "#6366F1", light: "#EEF2FF", dark: "#4338CA" },
  { accent: "#10B981", light: "#ECFDF5", dark: "#047857" },
  { accent: "#F59E0B", light: "#FFFBEB", dark: "#B45309" },
  { accent: "#8B5CF6", light: "#F5F3FF", dark: "#6D28D9" },
  { accent: "#EF4444", light: "#FEF2F2", dark: "#B91C1C" },
  { accent: "#0EA5E9", light: "#F0F9FF", dark: "#0369A1" },
];

/* ─── Main component ─────────────────────────────────────────────────── */
export default function ItineraryDisplay({ text, loading }) {
  if (!text && !loading) return null;

  /* Split raw text into sections by "N. EMOJI Title" or "## Title" */
  const lines = text.split("\n");
  const sections = [];
  let current = null;
  let buf = [];
  let idx = 0;

  const push = () => {
    if (current !== null || buf.some((l) => l.trim())) {
      sections.push({ title: current, lines: [...buf], idx: idx++ });
    }
    buf = [];
  };

  for (const line of lines) {
    const t = line.trim();
    const majorSection =
      t.match(/^(\d+)\.\s+(\p{Emoji}.+)$/u) ||
      t.match(/^#{1,3}\s+(.+)$/);

    if (majorSection) {
      push();
      current = majorSection[2] ?? majorSection[1];
    } else {
      buf.push(line);
    }
  }
  push();

  return (
    <div className="itinerary-root">
      {sections.map((sec) => {
        const pal = PALETTES[sec.idx % PALETTES.length];
        const blocks = renderLines(sec.lines);
        if (!sec.title && !blocks.length) return null;

        return (
          <div key={sec.idx} className="itin-section">
            {sec.title && (
              <div
                className="itin-section-header"
                style={{
                  "--accent": pal.accent,
                  "--light": pal.light,
                  "--dark": pal.dark,
                }}
              >
                <span className="itin-section-dot" />
                <span className="itin-section-title">{sec.title}</span>
              </div>
            )}
            {blocks.length > 0 && (
              <div className="itin-section-body">{blocks}</div>
            )}
          </div>
        );
      })}
      {loading && <span className="typing-cursor">▌</span>}
    </div>
  );
}
