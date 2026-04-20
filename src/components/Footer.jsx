import { Link } from "react-router-dom";

const LINKS = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/confidentialite",  label: "Confidentialité" },
  { to: "/cookies",          label: "Cookies" },
  { to: "/cgu",              label: "CGU" },
  { to: "/cgv",              label: "CGV" },
];

export default function Footer() {
  return (
    <footer style={{
      background   : "var(--ocean)",
      borderTop    : "1px solid rgba(255,255,255,0.06)",
      padding      : "2.5rem 0",
    }}>
      <div style={{
        width                : "90%",
        maxWidth             : "1600px",
        margin               : "0 auto",
        padding              : "0 32px",
        display              : "grid",
        gridTemplateColumns  : "1fr auto 1fr",
        alignItems           : "center",
        gap                  : "2rem",
      }}>

        {/* GAUCHE — Logo Qovee */}
        <div>
          <span style={{
            fontFamily    : "var(--font-sans)",
            fontSize      : "3.63rem",
            fontWeight    : 700,
            color         : "var(--sand)",
            letterSpacing : "-0.02em",
            lineHeight    : 1,
          }}>
            <span style={{ position: "relative", color: "var(--terra)" }}>
              Q
              <span style={{
                position     : "absolute",
                width        : "0.099em",
                height       : "0.099em",
                background   : "var(--gold)",
                borderRadius : "50%",
                bottom       : "0.24em",
                right        : "0.400em",
              }} />
            </span>
            ovee
          </span>
        </div>

        {/* CENTRE — Liens légaux */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          {LINKS.map(({ to, label }, i) => (
            <span key={to} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Link to={to} style={{
                fontFamily     : "var(--font-mono)",
                fontSize       : "0.828rem",
                color          : "var(--mist)",
                textDecoration : "none",
                letterSpacing  : "0.04em",
                transition     : "color 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--sand)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--mist)"}
              >{label}</Link>
              {i < LINKS.length - 1 && <span style={{ color: "#8A9BA8" }}>·</span>}
            </span>
          ))}
        </div>

        {/* DROITE — Baseline */}
        <p style={{
          fontFamily  : "var(--font-serif)",
          fontSize    : "1.546875rem",
          fontStyle   : "italic",
          textAlign   : "right",
          margin      : 0,
        }}>
          <span style={{ color: "#fff" }}>Décris le voyage. </span>
          <span style={{ color: "var(--terra)" }}>Qovee rédige le devis.</span>
        </p>

      </div>
    </footer>
  );
}
