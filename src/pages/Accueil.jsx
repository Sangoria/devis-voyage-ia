import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import DevisResult from "../components/DevisResult";
import { generateDevis } from "../services/claude";
import { generatePdf  } from "../services/generatePdf";
import { saveDevis     } from "../lib/supabase";
import { useAuth       } from "../contexts/AuthContext";
import "../App.css";

const FEATURES = ["Devis professionnel PDF", "Prêt à envoyer au client", "Généré en 2 minutes"];

const TYPES_GROUPE = ["Solo", "Couple", "Famille", "Amis", "Groupe"];

const TYPES_EXPERIENCE = [
  "Repos & plage",
  "Découverte culturelle",
  "Aventure & nature",
  "Gastronomie",
  "Randonnée",
  "City trip",
  "Road trip",
  "Luxe & bien-être",
];

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const FORM_INIT = {
  destination: "", typeGroupe: "", voyageurs: 2,
  budget: "", budgetMode: "total",
  dateDebut: "", dateFin: "", datesFlexibles: false,
  typesExperience: [], contraintes: "", demandeClient: "",
};

export default function Accueil() {
  const { user, isSubscribed, hasQuota, devisCount, FREE_QUOTA, incrementDevisCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Pré-remplissage depuis "Dupliquer" (/mes-devis passe formData via state)
  const prefill = location.state?.prefillForm ?? {};
  const [form,         setForm]         = useState({ ...FORM_INIT, ...prefill });
  const [devis,        setDevis]        = useState(null);
  const [savedDevisId, setSavedDevisId] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [detailsOpen,  setDetailsOpen]  = useState(false);
  const [saveError,    setSaveError]    = useState("");

  const resultRef = useRef(null);
  const formRef   = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleExperience = (exp) => {
    setForm((f) => {
      const has = f.typesExperience.includes(exp);
      return { ...f, typesExperience: has ? f.typesExperience.filter((x) => x !== exp) : [...f.typesExperience, exp] };
    });
  };

  useEffect(() => {
    if (devis && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [devis]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérification quota avant génération
    if (user && !hasQuota) {
      navigate("/pricing");
      return;
    }

    setLoading(true);
    setDevis(null);
    setError("");
    setSaveError("");
    setSavedDevisId(null);

    try {
      const result = await generateDevis(form);
      setDevis(result);

      // Auto-sauvegarde si connecté
      if (user) {
        const { data, error: saveErr } = await saveDevis({
          userId   : user.id,
          formData : form,
          devisJson: result,
        });
        if (saveErr) {
          setSaveError("Devis généré mais non sauvegardé : " + saveErr.message);
        } else {
          setSavedDevisId(data?.id ?? null);
          incrementDevisCount(); // met à jour le compteur de quota local
        }
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDevis(null);
    setError("");
    setSavedDevisId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModify = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handlePdf    = () => { if (devis) generatePdf(devis, form); };

  return (
    <div className="app">
      <Nav />

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
              <path d="M10 2l2.4 4.8L18 8l-4 3.9 1 5.1L10 14.5l-5 2.5 1-5.1L2 8l5.6-1.2L10 2z" fill="white" strokeWidth="0.5"/>
            </svg>
            Essayer gratuitement 14 jours
          </button>
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

        <form onSubmit={handleSubmit} className="card form-card" noValidate ref={formRef}>

          {/* Section 1 : Demande client */}
          <div className="demande-block">
            <div className="demande-header">
              <span className="demande-badge">Killer feature</span>
              <span className="demande-title">Colle ici la demande de ton client</span>
            </div>
            <div className="demande-field">
              <textarea
                id="demandeClient" name="demandeClient"
                value={form.demandeClient} onChange={handleChange}
                placeholder="Ex : Couple, Bali, 12 jours, budget 4 000€, plage et culture. Le client veut du repos en bord de mer avec quelques excursions culturelles."
                rows={5} required
              />
            </div>
            <p className="demande-hint">
              Collez la demande de votre client telle quelle — Qovee comprend le langage naturel
            </p>
          </div>

          {/* Section 2 : Affiner (accordéon) */}
          <button type="button" className="details-toggle"
            onClick={() => setDetailsOpen((o) => !o)} aria-expanded={detailsOpen}>
            <span className="details-toggle-left">
              <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Affiner le devis
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
                      <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input id="destination" name="destination" value={form.destination}
                      onChange={handleChange} placeholder="Ex: Bali, Indonésie"/>
                  </div>
                </div>

                {/* Composition du groupe */}
                <div className="form-field span-2">
                  <label>Composition du groupe</label>
                  <div className="groupe-row">
                    <div className="groupe-chips">
                      {TYPES_GROUPE.map((t) => (
                        <button key={t} type="button"
                          className={`groupe-chip${form.typeGroupe === t ? " active" : ""}`}
                          onClick={() => setForm((f) => ({ ...f, typeGroupe: f.typeGroupe === t ? "" : t }))}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="input-wrap voyageurs-input">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M15 8a3 3 0 010 6M17 17a5 5 0 00-3.5-4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <input type="number" name="voyageurs" value={form.voyageurs}
                        onChange={handleChange} min="1" max="50" title="Nombre de voyageurs"/>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div className="form-field span-2">
                  <label htmlFor="budget">Budget</label>
                  <div className="budget-row">
                    <div className="input-wrap budget-input">
                      <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      <input id="budget" type="number" name="budget" value={form.budget}
                        onChange={handleChange} placeholder="4 000" min="0"/>
                      <span className="input-suffix">€</span>
                    </div>
                    <div className="budget-toggle">
                      <button type="button"
                        className={`budget-toggle-btn${form.budgetMode === "total" ? " active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, budgetMode: "total" }))}>
                        Total
                      </button>
                      <button type="button"
                        className={`budget-toggle-btn${form.budgetMode === "personne" ? " active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, budgetMode: "personne" }))}>
                        / pers.
                      </button>
                    </div>
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
                    <input id="dateDebut" type="date" name="dateDebut"
                      value={form.dateDebut} onChange={handleChange}/>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="dateFin">Retour</label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 9h14M7 3v2M13 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input id="dateFin" type="date" name="dateFin"
                      value={form.dateFin} onChange={handleChange}/>
                  </div>
                </div>

                {/* Dates flexibles */}
                <div className="form-field span-2">
                  <label className="checkbox-label">
                    <input type="checkbox" name="datesFlexibles" checked={form.datesFlexibles}
                      onChange={handleChange} className="checkbox-input"/>
                    <span className="checkbox-box"/>
                    <span className="checkbox-text">Dates flexibles <span className="checkbox-hint">(±3 jours)</span></span>
                  </label>
                </div>

                {/* Type d'expérience */}
                <div className="form-field span-2">
                  <label>Type d'expérience recherchée</label>
                  <div className="exp-chips">
                    {TYPES_EXPERIENCE.map((exp) => {
                      const active = form.typesExperience.includes(exp);
                      return (
                        <button key={exp} type="button"
                          className={`exp-chip${active ? " active" : ""}`}
                          onClick={() => toggleExperience(exp)}>
                          {active && (
                            <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {exp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contraintes */}
                <div className="form-field span-2">
                  <label htmlFor="contraintes">
                    Contraintes particulières
                    <span className="label-optional"> — optionnel</span>
                  </label>
                  <textarea id="contraintes" name="contraintes" value={form.contraintes}
                    onChange={handleChange}
                    placeholder="Ex : PMR, régime végétarien, peur de l'avion, allergie..."
                    rows={2} className="contraintes-textarea"/>
                </div>
              </div>
            </div>
          )}

          <div className="form-cta">
            <button
              type="submit"
              disabled={loading || (user && !hasQuota)}
              className="cta-btn"
            >
              {loading ? (
                <><span className="cta-spinner"/>Génération en cours…</>
              ) : (user && !hasQuota) ? (
                "Quota atteint — Passer Pro →"
              ) : "Générer le devis →"}
            </button>

            {/* Compteur quota — visible uniquement pour les utilisateurs free connectés */}
            {user && !isSubscribed && (
              <div className={`quota-bar${devisCount >= FREE_QUOTA ? " quota-full" : ""}`}>
                <span className="quota-count">{devisCount}/{FREE_QUOTA}</span>
                {devisCount >= FREE_QUOTA ? (
                  <>
                    Devis gratuits épuisés —{" "}
                    <a href="/pricing" className="quota-link">Passer à l'abonnement Pro</a>
                  </>
                ) : (
                  `devis gratuit${devisCount > 1 ? "s" : ""} utilisé${devisCount > 1 ? "s" : ""}`
                )}
              </div>
            )}
          </div>
        </form>

        {/* Erreur génération */}
        {error && (
          <div className="error-banner">
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Notice sauvegarde */}
        {saveError && (
          <div className="error-banner" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
            ⚠️ {saveError}
          </div>
        )}
        {savedDevisId && !saveError && (
          <div className="save-notice">
            ✓ Devis sauvegardé dans <a href="/mes-devis" className="save-notice-link">Mes devis</a>
          </div>
        )}

        {/* Résultat */}
        {(devis || loading) && (
          <div className="card result-card" ref={resultRef}>
            {loading && (
              <div className="skeleton-wrap">
                <div className="skeleton-header">
                  <div className="skeleton" style={{ width: "55%", height: "28px" }}/>
                  <div className="skeleton" style={{ width: "80%", height: "14px", marginTop: "8px" }}/>
                  <div className="skeleton" style={{ width: "65%", height: "14px", marginTop: "6px" }}/>
                </div>
                <div className="skeleton-body">
                  {[90, 70, 85, 55, 75, 60].map((w, i) => (
                    <div key={i} className="skeleton" style={{ width: `${w}%` }}/>
                  ))}
                </div>
              </div>
            )}
            {!loading && devis && (
              <DevisResult devis={devis} onReset={handleReset} onModify={handleModify} onPdf={handlePdf}/>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Qovee © 2025</span>
        <span className="footer-dot">·</span>
        <span>Propulsé par Claude Sonnet 4.6</span>
        <span className="footer-dot">·</span>
        <span>29 €/mois</span>
      </footer>
    </div>
  );
}
