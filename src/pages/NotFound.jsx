import { Link } from "react-router-dom";
import "../App.css";

export default function NotFound() {
  return (
    <div className="app">
      <main style={{
        display        : "flex",
        flexDirection  : "column",
        alignItems     : "center",
        justifyContent : "center",
        minHeight      : "70vh",
        textAlign      : "center",
        padding        : "2rem",
        gap            : "1.5rem",
      }}>
        <div style={{
          fontFamily : "var(--font-serif, 'Cormorant Garamond', serif)",
          fontSize   : "clamp(5rem, 18vw, 10rem)",
          fontWeight : 600,
          color      : "#C4714A",
          lineHeight : 1,
          opacity    : 0.18,
          userSelect : "none",
        }}>
          404
        </div>
        <div style={{ marginTop: "-2rem" }}>
          <h1 style={{
            fontFamily : "var(--font-sans, 'Syne', sans-serif)",
            fontSize   : "clamp(1.4rem, 4vw, 2rem)",
            fontWeight : 700,
            color      : "#1C1611",
            margin     : "0 0 0.75rem",
          }}>
            Cette page n'existe pas.
          </h1>
          <p style={{
            fontSize : "1rem",
            color    : "#6B5D52",
            margin   : 0,
            maxWidth : "380px",
          }}>
            Vous avez peut-être suivi un lien expiré ou tapé une mauvaise adresse.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/" style={{
            display      : "inline-flex",
            alignItems   : "center",
            gap          : "0.4rem",
            padding      : "0.65rem 1.4rem",
            background   : "#C4714A",
            color        : "#fff",
            borderRadius : "8px",
            fontWeight   : 600,
            fontSize     : "0.9rem",
            textDecoration: "none",
            transition   : "background 0.2s",
          }}>
            ← Retour à l'accueil
          </Link>
          <Link to="/creer" style={{
            display      : "inline-flex",
            alignItems   : "center",
            gap          : "0.4rem",
            padding      : "0.65rem 1.4rem",
            background   : "transparent",
            color        : "#C4714A",
            border       : "1.5px solid #C4714A",
            borderRadius : "8px",
            fontWeight   : 600,
            fontSize     : "0.9rem",
            textDecoration: "none",
          }}>
            Créer un devis →
          </Link>
        </div>
      </main>
    </div>
  );
}
