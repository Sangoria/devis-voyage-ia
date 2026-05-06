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
    <footer className="site-footer">
      <div className="site-footer-inner">

        {/* GAUCHE — Logo Qovee */}
        <div className="site-footer-brand">
          <span className="site-footer-name">
            <span className="site-footer-name-q">Q</span>ovee
          </span>
        </div>

        {/* CENTRE — Liens légaux + contact */}
        <div className="site-footer-center">
          <div className="site-footer-links">
            {LINKS.map(({ to, label }, i) => (
              <span key={to} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Link to={to} className="site-footer-link">{label}</Link>
                {i < LINKS.length - 1 && <span className="site-footer-sep">·</span>}
              </span>
            ))}
          </div>
          <a href="mailto:contact.qovee@gmail.com" className="site-footer-email">
            contact.qovee@gmail.com
          </a>
        </div>

        {/* DROITE — Baseline */}
        <p className="site-footer-baseline">
          <span style={{ color: "#fff" }}>Décris le voyage. </span>
          <span style={{ color: "var(--terra)" }}>Qovee rédige le devis.</span>
        </p>

      </div>
    </footer>
  );
}
