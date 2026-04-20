import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LegalPage({ title, lastUpdated, content }) {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{title} — Qovee</title>
      </Helmet>

      <div style={{
        minHeight   : "100vh",
        background  : "#FAF7F2",
        padding     : "3rem 1.5rem 6rem",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          <Link to="/" style={{
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
            fontFamily : "Arial, Helvetica, sans-serif",
            fontSize   : "1rem",
            lineHeight : 1.7,
            color      : "#1A3040",
          }}
            className="legal-prose"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>

        </div>
      </div>
    </>
  );
}
