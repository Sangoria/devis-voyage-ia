import { useState, useRef, useEffect } from "react";
import ItineraryDisplay from "./ItineraryDisplay.jsx";
import "./App.css";

const TYPES = [
  {
    value: "aventure",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 3L4 9h4l-2 8 10-10h-4l3-4z" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    ),
    label: "Aventure",
    desc: "Randonnées & exploration",
  },
  {
    value: "détente",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
      </svg>
    ),
    label: "Détente",
    desc: "Plages & bien-être",
  },
  {
    value: "culture",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Culture",
    desc: "Musées & patrimoine",
  },
];

const FEATURES = ["Itinéraire jour par jour", "Budget optimisé", "Conseils d'initiés"];

export default function App() {
  const [form, setForm] = useState({
    destination: "",
    voyageurs: 2,
    budget: "",
    dateDebut: "",
    dateFin: "",
    typeVoyage: "détente",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (itinerary && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [!!itinerary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setItinerary("");
    setError("");

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Erreur serveur");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text, error: se } = JSON.parse(data);
            if (se) throw new Error(se);
            if (text) setItinerary((p) => p + text);
          } catch {}
        }
      }
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setItinerary("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <svg className="nav-logo" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366F1"/>
              <path d="M8 22 L16 8 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 18h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="nav-name">Wandr</span>
          </div>
          <div className="nav-badge">Bêta gratuite</div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-pill">Propulsé par Claude Opus</div>
          <h1 className="hero-title">
            Votre itinéraire<br />
            <span className="hero-gradient">sur-mesure en 30&nbsp;s</span>
          </h1>
          <p className="hero-sub">
            Décrivez votre voyage, notre IA génère un programme complet,
            réaliste et personnalisé — jour par jour.
          </p>
          <div className="hero-features">
            {FEATURES.map((f) => (
              <span key={f} className="hero-feature">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <main className="main">

        {/* Form card */}
        <form onSubmit={handleSubmit} className="card form-card" noValidate>
          <div className="form-section-label">Détails du voyage</div>

          <div className="form-grid">
            {/* Destination */}
            <div className="form-field span-2">
              <label htmlFor="destination">Destination</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input
                  id="destination"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Tokyo, Japon"
                  required
                />
              </div>
            </div>

            {/* Voyageurs */}
            <div className="form-field">
              <label htmlFor="voyageurs">Voyageurs</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M15 8a3 3 0 010 6M17 17a5 5 0 00-3.5-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="voyageurs"
                  type="number"
                  name="voyageurs"
                  value={form.voyageurs}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>

            {/* Budget */}
            <div className="form-field">
              <label htmlFor="budget">Budget total</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 13h2M10 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="budget"
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="3 000"
                  min="0"
                  required
                />
                <span className="input-suffix">€</span>
              </div>
            </div>

            {/* Dates */}
            <div className="form-field">
              <label htmlFor="dateDebut">Départ</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9h14M7 3v2M13 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="dateDebut"
                  type="date"
                  name="dateDebut"
                  value={form.dateDebut}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="dateFin">Retour</label>
              <div className="input-wrap">
                <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9h14M7 3v2M13 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="dateFin"
                  type="date"
                  name="dateFin"
                  value={form.dateFin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Type de voyage */}
          <div className="form-section-label" style={{ marginTop: "1.5rem" }}>
            Style de voyage
          </div>
          <div className="type-grid">
            {TYPES.map(({ value, icon, label, desc }) => (
              <label
                key={value}
                className={`type-card ${form.typeVoyage === value ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="typeVoyage"
                  value={value}
                  checked={form.typeVoyage === value}
                  onChange={handleChange}
                />
                <span className="type-icon">{icon}</span>
                <span className="type-label">{label}</span>
                <span className="type-desc">{desc}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading} className="cta-btn">
            {loading ? (
              <>
                <span className="cta-spinner" />
                Génération en cours…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M3 10l14-7-7 14V10H3z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
                Générer mon itinéraire
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Result */}
        {(itinerary || loading) && (
          <div className="card result-card" ref={resultRef}>
            <div className="result-header">
              <div className="result-header-left">
                <div className="result-avatar">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l2.4 4.8L18 8l-4 3.9 1 5.1L10 14.5l-5 2.5 1-5.1L2 8l5.6-1.2L10 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="result-title">Votre itinéraire</div>
                  <div className="result-meta">
                    {form.destination || "—"} · {form.voyageurs} voyageur{form.voyageurs > 1 ? "s" : ""} · {form.budget ? `${Number(form.budget).toLocaleString("fr-FR")} €` : "—"}
                  </div>
                </div>
              </div>
              {!loading && itinerary && (
                <button className="reset-btn" onClick={handleReset}>
                  Nouveau
                </button>
              )}
            </div>

            {loading && !itinerary && (
              <div className="skeleton-wrap">
                {[80, 60, 90, 50, 75].map((w, i) => (
                  <div key={i} className="skeleton" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            <ItineraryDisplay text={itinerary} loading={loading} />
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Wandr © 2025</span>
        <span className="footer-dot">·</span>
        <span>Propulsé par Claude Opus</span>
      </footer>
    </div>
  );
}
