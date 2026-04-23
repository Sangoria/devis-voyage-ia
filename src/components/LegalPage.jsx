import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LEGAL_LINKS = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite",  label: "Confidentialité" },
  { to: "/cookies",          label: "Cookies" },
  { to: "/cgu",              label: "CGU" },
  { to: "/cgv",              label: "CGV" },
];

const mdComponents = {
  h2: ({ children }) => (
    <h2 style={{
      fontFamily   : "'Syne', sans-serif",
      fontWeight   : 700,
      fontSize     : "1.5rem",
      color        : "#C4714A",
      marginTop    : "2.5rem",
      marginBottom : "0.5rem",
      lineHeight   : 1.2,
    }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{
      fontFamily   : "'Syne', sans-serif",
      fontWeight   : 700,
      fontSize     : "1.2rem",
      color        : "#C4714A",
      marginTop    : "2rem",
      marginBottom : "0.5rem",
      lineHeight   : 1.2,
    }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 style={{
      fontFamily   : "'Syne', sans-serif",
      fontWeight   : 600,
      fontSize     : "1rem",
      color        : "#1A3040",
      marginTop    : "1.25rem",
      marginBottom : "0.35rem",
    }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p style={{
      fontSize     : "1rem",
      lineHeight   : 1.7,
      marginBottom : "1rem",
    }}>{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      style={{ color: "#C4714A", textDecoration: "underline" }}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      background   : "#ffffff",
      borderLeft   : "4px solid #C4714A",
      borderRadius : "0 6px 6px 0",
      padding      : "0.75rem 1.25rem",
      fontStyle    : "italic",
      color        : "#8A9BA8",
      margin       : "1.5rem 0",
    }}>{children}</blockquote>
  ),
  ul: ({ children }) => (
    <ul style={{
      listStyle    : "none",
      paddingLeft  : "0.25rem",
      marginBottom : "1rem",
    }}>{children}</ul>
  ),
  li: ({ children }) => (
    <li style={{
      marginBottom : "0.4rem",
      lineHeight   : 1.6,
      display      : "flex",
      alignItems   : "baseline",
      gap          : "0.5rem",
    }}>
      <span style={{ color: "#C4714A", flexShrink: 0, fontSize: "1.1em" }}>·</span>
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
      <table style={{
        width          : "100%",
        borderCollapse : "collapse",
        fontSize       : "0.9rem",
      }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      background   : "#F2EBE0",
      color        : "#1A3040",
      fontFamily   : "'Syne', sans-serif",
      fontWeight   : 700,
      padding      : "0.6rem 0.9rem",
      border       : "1px solid #e0d8ce",
      textAlign    : "left",
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{
      padding      : "0.55rem 0.9rem",
      border       : "1px solid #e0d8ce",
      color        : "#1A3040",
      verticalAlign: "top",
    }}>{children}</td>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700 }}>{children}</strong>
  ),
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid #e0d8ce", margin: "2rem 0" }} />
  ),
};

export default function LegalPage({ title, lastUpdated, content }) {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{title} — Qovee</title>
      </Helmet>

      <div style={{
        minHeight  : "100vh",
        background : "#FAF7F2",
        padding    : "3rem 1.5rem 6rem",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          <Link
            to="/"
            style={{
              display        : "inline-flex",
              alignItems     : "center",
              gap            : "0.4rem",
              color          : "#C4714A",
              border         : "1.5px solid #C4714A",
              borderRadius   : "8px",
              padding        : "0.4rem 0.9rem",
              fontSize       : "0.82rem",
              fontFamily     : "'Syne', sans-serif",
              textDecoration : "none",
              marginBottom   : "2.5rem",
              transition     : "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#C4714A"; e.currentTarget.style.color = "#FAF7F2"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C4714A"; }}
          >
            ← Retour à l'accueil
          </Link>

          <h1 style={{
            fontFamily   : "'Syne', sans-serif",
            fontWeight   : 800,
            fontSize     : "clamp(1.75rem, 4vw, 2.5rem)",
            color        : "#1A3040",
            lineHeight   : 1.15,
            marginBottom : "0.5rem",
          }}>
            {title}
          </h1>

          {lastUpdated && (
            <p style={{
              fontFamily   : "'DM Mono', monospace",
              fontSize     : "0.78rem",
              color        : "#8A9BA8",
              marginBottom : "2.5rem",
            }}>
              Dernière mise à jour : {lastUpdated}
            </p>
          )}

          <div style={{
            fontFamily : "system-ui, -apple-system, 'Segoe UI', sans-serif",
            fontSize   : "1rem",
            lineHeight : 1.7,
            color      : "#1A3040",
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content}
            </ReactMarkdown>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e0d8ce", margin: "3rem 0 2rem" }} />

          <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem" }}>
            {LEGAL_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize       : "0.8rem",
                  fontFamily     : "'Syne', sans-serif",
                  color          : "#8A9BA8",
                  textDecoration : "none",
                  transition     : "color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#C4714A"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#8A9BA8"; }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

        </div>
      </div>
    </>
  );
}
