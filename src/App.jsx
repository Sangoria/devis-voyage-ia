import { useState, useRef, useEffect } from "react";
import DevisResult from "./components/DevisResult.jsx";
import { generateDevis } from "./services/claude.js";
import "./App.css";

const FEATURES = ["Devis professionnel PDF", "Prêt à envoyer au client", "Généré en 2 minutes"];

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function App() {
  const [form, setForm] = useState({
    destination: "",
    voyageurs: 2,
    budget: "",
    dateDebut: "",
    dateFin: "",
    demandeClient: "",
  });
  const [devis, setDevis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const resultRef = useRef(null);
  const formRef = useRef(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (devis && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [devis]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevis(null);
    setError("");

    try {
      const result = await generateDevis(form);
      setDevis(result);
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDevis(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModify = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePdf = () => {
    window.print();
  };

  return (
    <div className="app">
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            {/* Logo : loupe stylisée */}
            <svg className="nav-logo" viewBox="0 0 30 30" fill="none">
              <circle cx="12" cy="12" r="8.5" stroke="#C4714A" strokeWidth="2.2"/>
              <circle cx="12" cy="12" r="4.5" fill="rgba(196,113,74,.15)"/>
              <path d="M18.5 18.5L26 26" stroke="#C4714A" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M12 9v6M9 12h6" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="nav-name">QOVEE</span>
          </div>
          <div className="nav-badge">Essai 14 jours</div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-pill">Propulsé par Claude Opus 4.6</div>
          <h1 className="hero-title">
            Décris le voyage.{" "}
            <span className="hero-title-accent">Qovee rédige le devis.</span>
          </h1>
          <p className="hero-sub">
            Qovee génère un devis voyage pro en 2 minutes.
            Pour 29&nbsp;€/mois.
          </p>
          <button className="hero-cta" onClick={scrollToForm}>
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path d="M10 2l2.4 4.8L18 8l-4 3.9 1 5.1L10 14.5l-5 2.5 1-5.1L2 8l5.6-1.2L10 2z"
                fill="white" strokeWidth="0.5"/>
            </svg>
            Essayer gratuitement 14 jours
          </button>
          <div className="hero-features">
            {FEATURES.map((f) => (
              <span key={f} className="hero-feature">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
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
        <form onSubmit={handleSubmit} className="card form-card" noValidate ref={formRef}>

          {/* ── Section 1 : Demande client (killer feature) ── */}
          <div className="demande-block">
            <div className="demande-header">
              <span className="demande-badge">Killer feature</span>
              <span className="demande-title">Colle ici la demande de ton client</span>
            </div>
            <div className="demande-field">
              <textarea
                id="demandeClient"
                name="demandeClient"
                value={form.demandeClient}
                onChange={handleChange}
                placeholder={"Ex : Couple, Bali, 12 jours, budget 4 000€, plage et culture locale. Hôtels boutique, pas les grandes chaînes. Éviter les spots trop touristiques."}
                rows={6}
                required
              />
            </div>
          </div>

          {/* ── Section 2 : Détails (accordéon optionnel) ── */}
          <button
            type="button"
            className="details-toggle"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
          >
            <span className="details-toggle-left">
              <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Affiner avec les détails
            </span>
            <span className="details-toggle-right">
              <span className="details-optional">optionnel</span>
              <ChevronIcon open={detailsOpen} />
            </span>
          </button>

          {detailsOpen && (
            <div className="details-body">
              <div className="form-grid">
                {/* Destination */}
                <div className="form-field span-2">
                  <label htmlFor="destination">Destination</label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"
                        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input
                      id="destination"
                      name="destination"
                      value={form.destination}
                      onChange={handleChange}
                      placeholder="Ex: Bali, Indonésie"
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
                      <path d="M15 8a3 3 0 010 6M17 17a5 5 0 00-3.5-4.8"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      id="voyageurs"
                      type="number"
                      name="voyageurs"
                      value={form.voyageurs}
                      onChange={handleChange}
                      min="1"
                      max="50"
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
                      placeholder="4 000"
                      min="0"
                    />
                    <span className="input-suffix">€</span>
                  </div>
                </div>

                {/* Départ */}
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
                    />
                  </div>
                </div>

                {/* Retour */}
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
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-cta">
            <button type="submit" disabled={loading} className="cta-btn">
              {loading ? (
                <>
                  <span className="cta-spinner" />
                  Génération en cours…
                </>
              ) : (
                "Générer le devis →"
              )}
            </button>
          </div>
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
        {(devis || loading) && (
          <div className="card result-card" ref={resultRef}>
            {loading && (
              <div className="skeleton-wrap">
                <div className="skeleton-header">
                  <div className="skeleton" style={{ width: "55%", height: "28px" }} />
                  <div className="skeleton" style={{ width: "80%", height: "14px", marginTop: "8px" }} />
                  <div className="skeleton" style={{ width: "65%", height: "14px", marginTop: "6px" }} />
                </div>
                <div className="skeleton-body">
                  {[90, 70, 85, 55, 75, 60].map((w, i) => (
                    <div key={i} className="skeleton" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            )}

            {!loading && devis && (
              <DevisResult
                devis={devis}
                onReset={handleReset}
                onModify={handleModify}
                onPdf={handlePdf}
              />
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Qovee © 2025</span>
        <span className="footer-dot">·</span>
        <span>Propulsé par Claude Opus 4.6</span>
        <span className="footer-dot">·</span>
        <span>29 €/mois</span>
      </footer>
    </div>
  );
}
