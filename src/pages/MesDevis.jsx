import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Nav from "../components/Nav";
import DevisResult from "../components/DevisResult";
import { generatePdf   } from "../services/generatePdf";
import { fetchDevis, updateDevisStatus, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUTS = [
  { key: "tous",      label: "Tous" },
  { key: "brouillon", label: "Brouillon" },
  { key: "envoye",    label: "Envoyé" },
  { key: "accepte",   label: "Accepté" },
  { key: "refuse",    label: "Refusé" },
];

const STATUT_META = {
  brouillon: { label: "Brouillon", cls: "badge-brouillon" },
  envoye:    { label: "Envoyé",    cls: "badge-envoye"    },
  accepte:   { label: "Accepté",   cls: "badge-accepte"   },
  refuse:    { label: "Refusé",    cls: "badge-refuse"    },
  expire:    { label: "Expiré",    cls: "badge-expire"    },
};

function money(n) {
  if (!n) return "—";
  return Number(n).toLocaleString("fr-FR") + " €";
}

function dateShort(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Reconstruit un formData depuis une ligne DB (pour le PDF)
function rowToFormData(row) {
  return {
    destination     : row.destination     ?? "",
    typeGroupe      : row.group_type       ?? "",
    voyageurs       : row.travelers        ?? 2,
    budget          : row.budget           ?? "",
    budgetMode      : row.budget_type === "par_personne" ? "personne" : "total",
    dateDebut       : row.start_date       ?? "",
    dateFin         : row.end_date         ?? "",
    datesFlexibles  : row.dates_flexibles  ?? false,
    typesExperience : row.experience_type  ?? [],
    contraintes     : row.contraintes      ?? "",
    demandeClient   : row.client_description ?? "",
  };
}

export default function MesDevis() {
  const { user, refreshProfile } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Succès après retour de Stripe Checkout → recharge le profil pour avoir le bon statut
  const checkoutSuccess = new URLSearchParams(location.search).get("checkout") === "success";
  useEffect(() => {
    if (checkoutSuccess) refreshProfile();
  }, [checkoutSuccess]); // eslint-disable-line

  const [devisList,   setDevisList]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtre,      setFiltre]      = useState("tous");
  const [selected,    setSelected]    = useState(null);   // devis ouvert dans le modal
  const [updating,    setUpdating]    = useState(null);   // id du devis en cours de mise à jour

  // Charger les devis
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await fetchDevis(user.id);
    if (!error) setDevisList(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Filtrer
  const visible = filtre === "tous"
    ? devisList
    : devisList.filter((d) => d.status === filtre);

  // Marquer comme envoyé
  async function markEnvoye(id, e) {
    e.stopPropagation();
    setUpdating(id);
    const { data } = await updateDevisStatus(id, "envoye");
    if (data) {
      setDevisList((list) => list.map((d) => d.id === id ? { ...d, ...data } : d));
      if (selected?.id === id) setSelected({ ...selected, ...data });
    }
    setUpdating(null);
  }

  // Marquer comme accepté / refusé
  async function markStatus(id, status, e) {
    e.stopPropagation();
    setUpdating(id);
    const { data } = await updateDevisStatus(id, status);
    if (data) {
      setDevisList((list) => list.map((d) => d.id === id ? { ...d, ...data } : d));
      if (selected?.id === id) setSelected({ ...selected, ...data });
    }
    setUpdating(null);
  }

  // Supprimer un devis
  async function deleteDevis(id, e) {
    e.stopPropagation();
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    await supabase.from("devis").delete().eq("id", id);
    setDevisList((list) => list.filter((d) => d.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  // Dupliquer → rediriger vers / avec le formulaire pré-rempli
  function duplicate(row, e) {
    e.stopPropagation();
    navigate("/", { state: { prefillForm: rowToFormData(row) } });
  }

  // Télécharger le PDF depuis /mes-devis
  function downloadPdf(row, e) {
    e.stopPropagation();
    if (row.generated_content) {
      generatePdf(row.generated_content, rowToFormData(row));
    }
  }

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <Nav />

      <main className="mes-devis-main">

        {/* Notice succès abonnement */}
        {checkoutSuccess && (
          <div style={{
            background: "rgba(40,167,69,.08)", border: "1px solid rgba(40,167,69,.3)",
            color: "#166534", borderRadius: "10px", padding: "0.9rem 1.25rem",
            marginBottom: "1.5rem", textAlign: "center", fontWeight: 600, fontSize: "0.9rem",
          }}>
            ✓ Abonnement activé — bienvenue dans Qovee Pro&nbsp;! Devis illimités.
          </div>
        )}

        {/* Header */}
        <div className="mes-devis-header">
          <div>
            <h1 className="mes-devis-title">Mes devis</h1>
            <p className="mes-devis-sub">
              {devisList.length} devis au total
            </p>
          </div>
          <button className="cta-btn mes-devis-new" onClick={() => navigate("/")}>
            + Nouveau devis
          </button>
        </div>

        {/* Filtres */}
        <div className="mes-devis-filtres">
          {STATUTS.map((s) => {
            const count = s.key === "tous"
              ? devisList.length
              : devisList.filter((d) => d.status === s.key).length;
            return (
              <button
                key={s.key}
                className={`filtre-btn${filtre === s.key ? " active" : ""}`}
                onClick={() => setFiltre(s.key)}
              >
                {s.label}
                {count > 0 && <span className="filtre-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* États */}
        {loading && (
          <div className="mes-devis-loading">
            <span className="cta-spinner" style={{ borderColor: "rgba(26,48,64,.2)", borderTopColor: "#C4714A" }}/>
            Chargement…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="mes-devis-empty">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="#ADBBC6" strokeWidth="2"/>
              <path d="M16 16h16M16 22h16M16 28h10" stroke="#ADBBC6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{filtre === "tous" ? "Aucun devis pour l'instant." : `Aucun devis "${filtre}".`}</p>
            <button className="cta-btn" style={{ marginTop: "1rem", width: "auto", padding: "0 1.5rem" }}
              onClick={() => navigate("/")}>
              Générer mon premier devis →
            </button>
          </div>
        )}

        {/* Grille des devis */}
        {!loading && visible.length > 0 && (
          <div className="devis-grid">
            {visible.map((row) => {
              const meta = STATUT_META[row.status] ?? STATUT_META.brouillon;
              return (
                <div
                  key={row.id}
                  className="devis-card"
                  onClick={() => setSelected(row)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(row)}
                >
                  {/* Top : destination + badge */}
                  <div className="devis-card-top">
                    <span className="devis-card-dest">
                      {row.title || row.destination || "Voyage sans titre"}
                    </span>
                    <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
                  </div>

                  {/* Ref + client */}
                  <div className="devis-card-ref">
                    <span>{row.devis_number ?? "—"}</span>
                    {row.client_name && <span className="devis-card-client">{row.client_name}</span>}
                  </div>

                  {/* Info */}
                  <div className="devis-card-info">
                    {row.destination && (
                      <span>
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                          <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.3"/>
                        </svg>
                        {row.destination}
                      </span>
                    )}
                    {row.travelers && (
                      <span>
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                          <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M1 12a4 4 0 018 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        {row.travelers} pers.
                      </span>
                    )}
                  </div>

                  {/* Montant + date */}
                  <div className="devis-card-footer">
                    <span className="devis-card-price">{money(row.total_price)}</span>
                    <span className="devis-card-date">{dateShort(row.created_at)}</span>
                  </div>

                  {/* Actions rapides */}
                  <div className="devis-card-actions" onClick={(e) => e.stopPropagation()}>
                    {row.status === "brouillon" && (
                      <button
                        className="card-action-btn card-action-envoye"
                        onClick={(e) => markEnvoye(row.id, e)}
                        disabled={updating === row.id}
                        title="Marquer comme envoyé"
                      >
                        {updating === row.id ? "…" : "✓ Marquer envoyé"}
                      </button>
                    )}
                    {row.status === "envoye" && (
                      <>
                        <button className="card-action-btn card-action-accepte"
                          onClick={(e) => markStatus(row.id, "accepte", e)} disabled={updating === row.id}>
                          ✓ Accepté
                        </button>
                        <button className="card-action-btn card-action-refuse"
                          onClick={(e) => markStatus(row.id, "refuse", e)} disabled={updating === row.id}>
                          ✗ Refusé
                        </button>
                      </>
                    )}
                    <button className="card-action-btn card-action-duplicate"
                      onClick={(e) => duplicate(row, e)} title="Dupliquer">
                      <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                        <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      Dupliquer
                    </button>
                    {row.generated_content && (
                      <button className="card-action-btn card-action-pdf"
                        onClick={(e) => downloadPdf(row, e)} title="Télécharger PDF">
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                          <path d="M4 1h6l3 3v9H1V1h3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M7 10V6M5 8l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        PDF
                      </button>
                    )}
                    <button className="card-action-btn card-action-delete"
                      onClick={(e) => deleteDevis(row.id, e)} title="Supprimer">
                      <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                        <path d="M2 4h10M5 4V2h4v2M11 4l-.8 8H3.8L3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal de détail ────────────────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className={`status-badge ${STATUT_META[selected.status]?.cls ?? "badge-brouillon"}`}>
                  {STATUT_META[selected.status]?.label ?? selected.status}
                </span>
                <span className="modal-ref">{selected.devis_number}</span>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Actions dans le modal */}
            <div className="modal-actions-bar">
              {selected.status === "brouillon" && (
                <button className="card-action-btn card-action-envoye"
                  onClick={(e) => markEnvoye(selected.id, e)} disabled={updating === selected.id}>
                  {updating === selected.id ? "…" : "✓ Marquer comme envoyé"}
                </button>
              )}
              {selected.status === "envoye" && (
                <>
                  <button className="card-action-btn card-action-accepte"
                    onClick={(e) => markStatus(selected.id, "accepte", e)}>✓ Accepté</button>
                  <button className="card-action-btn card-action-refuse"
                    onClick={(e) => markStatus(selected.id, "refuse", e)}>✗ Refusé</button>
                </>
              )}
              <button className="card-action-btn card-action-duplicate"
                onClick={(e) => duplicate(selected, e)}>
                Dupliquer
              </button>
              {selected.generated_content && (
                <button className="card-action-btn card-action-pdf"
                  onClick={(e) => downloadPdf(selected, e)}>
                  Télécharger PDF
                </button>
              )}
            </div>

            {/* Contenu */}
            <div className="modal-body">
              {selected.generated_content ? (
                <div className="card result-card" style={{ margin: 0, borderRadius: "12px" }}>
                  <DevisResult
                    devis={selected.generated_content}
                    onReset={() => setSelected(null)}
                    onModify={() => { setSelected(null); navigate("/"); }}
                    onPdf={() => generatePdf(selected.generated_content, rowToFormData(selected))}
                  />
                </div>
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "#8A9BA8" }}>
                  Contenu du devis non disponible.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <span>Qovee © 2025</span>
        <span className="footer-dot">·</span>
        <span>29 €/mois</span>
      </footer>
    </div>
  );
}
