import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import DevisResult from "../components/DevisResult";
import { generateDevis } from "../services/claude";
import { generatePdf  } from "../services/generatePdf";
import { saveDevis     } from "../lib/supabase";
import { useAuth       } from "../contexts/AuthContext";
import "../App.css";

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
  aeroportDepart: "", aeroportArrivee: "", compagnieAerienne: "", prixVols: "",
  nomHotel: "", etoilesHotel: "", prixHotel: "", formuleHotel: "",
  transfertInclus: false, prixTransfert: "", nomTransporteur: "",
  locationVehicule: false, nomLoueur: "", typeVehicule: "", prixLocation: "",
};

export default function CreerDevis() {
  const { user, profile, isSubscribed, hasQuota, devisCount, FREE_QUOTA, incrementDevisCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          incrementDevisCount();
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

  const handleRegenerate = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handlePdf        = async (devisData) => { await generatePdf(devisData ?? devis, form, profile); };
  const handleSaved      = (updated) => setDevis(updated);

  return (
    <div className="app">
      <Nav />

      <main className="main" style={{ paddingTop: "3rem" }}>

        <form onSubmit={handleSubmit} className="card form-card" noValidate ref={formRef}>

          {/* Section 1 : Demande client */}
          <div className="demande-block">
            <div className="demande-header">
              <span className="demande-title">Colle ici la demande de ton client</span>
            </div>
            <div className="demande-field">
              <textarea
                id="demandeClient" name="demandeClient"
                value={form.demandeClient} onChange={handleChange}
                placeholder="Ex : Couple, Bali, 12 jours du 14 au 26 juin, budget 5 000€. On veut du calme et de la nature, quelques jours à Ubud pour les rizières, puis fin de séjour à Seminyak côté mer. Pas d'hôtels trop touristiques. Un des deux supporte mal les longs vols, éviter les escales si possible."
                rows={5} required
              />
            </div>
            <p className="demande-hint">
              Collez la demande de votre client telle quelle, Qovee comprend le langage naturel
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
                    <input id="dateDebut" type="text" name="dateDebut"
                      value={form.dateDebut} onChange={handleChange}
                      placeholder="jj/mm/aaaa" maxLength={10}
                      onInput={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 3) v = v.slice(0,2) + "/" + v.slice(2);
                        if (v.length >= 6) v = v.slice(0,5) + "/" + v.slice(5,9);
                        e.target.value = v;
                      }}/>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="dateFin">Retour</label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 9h14M7 3v2M13 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input id="dateFin" type="text" name="dateFin"
                      value={form.dateFin} onChange={handleChange}
                      placeholder="jj/mm/aaaa" maxLength={10}
                      onInput={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 3) v = v.slice(0,2) + "/" + v.slice(2);
                        if (v.length >= 6) v = v.slice(0,5) + "/" + v.slice(5,9);
                        e.target.value = v;
                      }}/>
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


                {/* ── Séparateur Vol ── */}
                <div className="form-field span-2">
                  <div className="affiner-section-title">
                    <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                      <path d="M3 13l3-3 3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 6H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Vol
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="aeroportDepart">
                    Aéroport de départ
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <path d="M3 17h14M5 13l2-8 5 3 3-5 2 1-3 6 3 2-1 2-5-3-4 3-2-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <input id="aeroportDepart" name="aeroportDepart"
                      value={form.aeroportDepart} onChange={handleChange}
                      placeholder="Ex : Paris CDG, Lyon LYS…"/>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="aeroportArrivee">
                    Aéroport d'arrivée
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <path d="M3 17h14M5 13l2-8 5 3 3-5 2 1-3 6 3 2-1 2-5-3-4 3-2-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <input id="aeroportArrivee" name="aeroportArrivee"
                      value={form.aeroportArrivee} onChange={handleChange}
                      placeholder="Ex : Bali DPS, Tokyo NRT…"/>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="compagnieAerienne">
                    Compagnie aérienne
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <path d="M3 13l3-3 3 3 5-5M17 6H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input id="compagnieAerienne" name="compagnieAerienne"
                      value={form.compagnieAerienne} onChange={handleChange}
                      placeholder="Ex : Air France, Emirates…"/>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="prixVols">
                    Prix des vols
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input id="prixVols" type="number" name="prixVols"
                      value={form.prixVols} onChange={handleChange}
                      placeholder="1 570" min="0"/>
                    <span className="input-suffix">€</span>
                  </div>
                </div>

                {/* ── Séparateur Hôtel ── */}
                <div className="form-field span-2">
                  <div className="affiner-section-title">
                    <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                      <rect x="2" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Hôtel
                  </div>
                </div>

                <div className="form-field span-2">
                  <label htmlFor="nomHotel">
                    Nom de l'hôtel
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M6 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input id="nomHotel" name="nomHotel"
                      value={form.nomHotel} onChange={handleChange}
                      placeholder="Ex : Alaya Resort Ubud"/>
                  </div>
                  <p className="field-hint">Si plusieurs hôtels, merci de les modifier directement une fois le devis généré</p>
                </div>

                <div className="form-field">
                  <label>
                    Nombre d'étoiles
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="groupe-chips" style={{ marginTop: "0.25rem" }}>
                    {["1","2","3","4","5"].map((n) => (
                      <button key={n} type="button"
                        className={`groupe-chip${form.etoilesHotel === n ? " active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, etoilesHotel: f.etoilesHotel === n ? "" : n }))}>
                        {n}★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="prixHotel">
                    Prix de l'hôtel
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input id="prixHotel" type="number" name="prixHotel"
                      value={form.prixHotel} onChange={handleChange}
                      placeholder="155" min="0"/>
                    <span className="input-suffix">€/nuit</span>
                  </div>
                </div>

                <div className="form-field span-2">
                  <label>
                    Formule
                    <span className="label-optional"> · optionnel</span>
                  </label>
                  <div className="groupe-chips" style={{ marginTop: "0.25rem" }}>
                    {["Aucun", "Demi-pension", "Pension complète", "Tout compris"].map((r) => (
                      <button key={r} type="button"
                        className={`groupe-chip${form.formuleHotel === r ? " active" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, formuleHotel: f.formuleHotel === r ? "" : r }))}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Séparateur Transfert ── */}
                <div className="form-field span-2">
                  <div className="affiner-section-title">
                    <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                      <rect x="1" y="7" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="11" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M15 11h2a2 2 0 012 2v2h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Transfert
                  </div>
                </div>

                <div className="form-field span-2">
                  <label className="checkbox-label">
                    <input type="checkbox" name="transfertInclus" checked={form.transfertInclus}
                      onChange={handleChange} className="checkbox-input"/>
                    <span className="checkbox-box"/>
                    <span className="checkbox-text">Transfert inclus</span>
                  </label>
                </div>

                {form.transfertInclus && (
                  <>
                    <div className="form-field">
                      <label htmlFor="nomTransporteur">Nom du transporteur</label>
                      <div className="input-wrap">
                        <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                          <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input id="nomTransporteur" name="nomTransporteur"
                          value={form.nomTransporteur} onChange={handleChange}
                          placeholder="Ex : Bali Private Driver"/>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="prixTransfert">Prix du transfert</label>
                      <div className="input-wrap">
                        <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <input id="prixTransfert" type="number" name="prixTransfert"
                          value={form.prixTransfert} onChange={handleChange}
                          placeholder="185" min="0"/>
                        <span className="input-suffix">€</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-field span-2">
                  <label className="checkbox-label">
                    <input type="checkbox" name="locationVehicule" checked={form.locationVehicule}
                      onChange={handleChange} className="checkbox-input"/>
                    <span className="checkbox-box"/>
                    <span className="checkbox-text">Location de véhicule</span>
                  </label>
                </div>

                {form.locationVehicule && (
                  <>
                    <div className="form-field span-2">
                      <label htmlFor="nomLoueur">Nom du loueur</label>
                      <div className="input-wrap">
                        <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                          <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 17a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input id="nomLoueur" name="nomLoueur"
                          value={form.nomLoueur} onChange={handleChange}
                          placeholder="Ex : Europcar, Hertz, loueur local…"/>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="typeVehicule">Type de véhicule</label>
                      <div className="input-wrap">
                        <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="7" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 7V6a2 2 0 014 0v1M11 7V6a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="5.5" cy="15" r="1.5" fill="currentColor"/>
                          <circle cx="14.5" cy="15" r="1.5" fill="currentColor"/>
                        </svg>
                        <input id="typeVehicule" name="typeVehicule"
                          value={form.typeVehicule} onChange={handleChange}
                          placeholder="Ex : SUV automatique, 4x4…"/>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="prixLocation">Prix de la location</label>
                      <div className="input-wrap">
                        <svg className="input-icon" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <input id="prixLocation" type="number" name="prixLocation"
                          value={form.prixLocation} onChange={handleChange}
                          placeholder="560" min="0"/>
                        <span className="input-suffix">€</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Contraintes — toujours en dernier */}
                <div className="form-field span-2" style={{ marginTop: "0.5rem" }}>
                  <div className="affiner-section-title">
                    <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Contraintes
                  </div>
                </div>
                <div className="form-field span-2">
                  <label htmlFor="contraintes">
                    Contraintes particulières
                    <span className="label-optional"> · optionnel</span>
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
                "Quota atteint · Passer Pro →"
              ) : "Générer le devis →"}
            </button>

            {user && !isSubscribed && (
              <div className={`quota-bar${devisCount >= FREE_QUOTA ? " quota-full" : ""}`}>
                <span className="quota-count">{devisCount}/{FREE_QUOTA}</span>
                {devisCount >= FREE_QUOTA ? (
                  <>
                    Devis gratuits épuisés,{" "}
                    <a href="/pricing" className="quota-link">Passer à l'abonnement Pro</a>
                  </>
                ) : (
                  `devis gratuit${devisCount > 1 ? "s" : ""} utilisé${devisCount > 1 ? "s" : ""}`
                )}
              </div>
            )}
          </div>
        </form>

        {error && (
          <div className="error-banner">
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

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
              <DevisResult
                devis={devis}
                savedDevisId={savedDevisId}
                onReset={handleReset}
                onRegenerate={handleRegenerate}
                onPdf={handlePdf}
                onSaved={handleSaved}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
