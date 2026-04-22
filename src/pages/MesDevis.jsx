import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

const PERIODES = [
  { key: "mois",      label: "Ce mois"     },
  { key: "trimestre", label: "Ce trimestre" },
  { key: "annee",     label: "Cette année"  },
  { key: "tout",      label: "Tout"         },
];

const RELANCE_JOURS  = 5;
const VALIDITE_JOURS = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────
function money(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("fr-FR") + " €";
}

function dateShort(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function periodStart(key) {
  const now = new Date();
  if (key === "mois")      return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "trimestre") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (key === "annee")     return new Date(now.getFullYear(), 0, 1);
  return new Date(0);
}

function needsRelance(row) {
  if (row.status !== "envoye") return false;
  const ref = row.sent_at ? new Date(row.sent_at) : new Date(row.created_at);
  return (Date.now() - ref.getTime()) > RELANCE_JOURS * 86400000;
}

function expireBientot(row) {
  if (["accepte", "refuse"].includes(row.status)) return false;
  const age = (Date.now() - new Date(row.created_at).getTime()) / 86400000;
  return age >= 25 && age < VALIDITE_JOURS;
}

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

function exportCSV(list) {
  const headers = ["Titre", "Client", "Email client", "Destination", "Statut", "Montant (€)", "Voyageurs", "Date création", "Date envoi"];
  const rows = list.map((d) => [
    d.title || d.destination || "—",
    d.client_name  || "—",
    d.client_email || "—",
    d.destination  || "—",
    d.status       || "—",
    d.total_price  || 0,
    d.travelers    || "—",
    dateShort(d.created_at),
    d.sent_at ? dateShort(d.sent_at) : "—",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `devis-qovee-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Composant stats ───────────────────────────────────────────────────────────
function StatCards({ devisList, periode }) {
  const start = periodStart(periode);
  const inPeriod = (d) => new Date(d.created_at) >= start;
  const slice = devisList.filter(inPeriod);

  const generes  = slice.length;
  const envoyes  = slice.filter((d) => d.status === "envoye").length;
  const acceptes = slice.filter((d) => d.status === "accepte").length;
  const refuses  = slice.filter((d) => d.status === "refuse").length;
  const taux     = envoyes > 0 ? Math.round((acceptes / (acceptes + refuses || envoyes)) * 100) : 0;
  const caPot    = slice.filter((d) => d.status === "envoye").reduce((s, d) => s + Number(d.total_price || 0), 0);
  const caConf   = slice.filter((d) => d.status === "accepte").reduce((s, d) => s + Number(d.total_price || 0), 0);

  const cards = [
    { label: "Générés",     value: generes,  sub: "ce mois",        color: "var(--ocean)"  },
    { label: "Envoyés",     value: envoyes,  sub: "en attente",     color: "var(--ocean)"  },
    { label: "Acceptés",    value: acceptes, sub: "signés",         color: "#2e7d32"       },
    { label: "Refusés",     value: refuses,  sub: "perdus",         color: "#c0392b"       },
    { label: "Taux de conversion", value: `${taux}%`, sub: `${envoyes} → ${acceptes}`, color: "var(--ocean)" },
    { label: "CA potentiel",value: money(caPot), sub: "devis envoyés",  color: "var(--gold)"   },
    { label: "CA confirmé", value: money(caConf),sub: "devis acceptés", color: "var(--gold)"   },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <span className="stat-label">{c.label}</span>
          <span className="stat-value" style={{ color: c.color }}>{c.value}</span>
          <span className="stat-sub">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ── Composant alertes ─────────────────────────────────────────────────────────
function AlertSection({ devisList, onOpen }) {
  const alerts = devisList.filter((d) => needsRelance(d) || expireBientot(d));
  if (alerts.length === 0) return null;

  return (
    <div className="alerts-section">
      <div className="alerts-header">
        <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
          <path d="M9 2L16.5 15H1.5L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 7v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {alerts.length} devis nécessite{alerts.length > 1 ? "nt" : ""} votre attention
      </div>
      <div className="alerts-list">
        {alerts.map((d) => (
          <div key={d.id} className="alert-row" onClick={() => onOpen(d)}>
            <div className="alert-row-left">
              <span className="alert-row-title">{d.title || d.destination || "Sans titre"}</span>
              {d.client_name && <span className="alert-row-client">{d.client_name}</span>}
            </div>
            <div className="alert-row-right">
              {needsRelance(d) && <span className="alert-badge alert-relance">Relancer ?</span>}
              {expireBientot(d) && <span className="alert-badge alert-expire">Expire bientôt</span>}
              <span className="alert-row-price">{money(d.total_price)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Vue par client ────────────────────────────────────────────────────────────
function ClientView({ devisList, onOpen }) {
  const groups = useMemo(() => {
    const map = {};
    devisList.forEach((d) => {
      const key = d.client_name || d.client_email || "Sans client renseigné";
      if (!map[key]) map[key] = { name: key, email: d.client_email, devis: [] };
      map[key].devis.push(d);
    });
    return Object.values(map).sort((a, b) => b.devis.length - a.devis.length);
  }, [devisList]);

  if (groups.length === 0) return <div className="mes-devis-empty"><p>Aucun devis.</p></div>;

  return (
    <div className="client-groups">
      {groups.map((g) => {
        const ca = g.devis.filter((d) => d.status === "accepte").reduce((s, d) => s + Number(d.total_price || 0), 0);
        return (
          <div key={g.name} className="client-group">
            <div className="client-group-header">
              <div>
                <span className="client-group-name">{g.name}</span>
                {g.email && <span className="client-group-email">{g.email}</span>}
              </div>
              <div className="client-group-meta">
                <span>{g.devis.length} devis</span>
                {ca > 0 && <span className="client-group-ca">{money(ca)} confirmé</span>}
              </div>
            </div>
            <div className="client-group-devis">
              {g.devis.map((d) => {
                const meta = STATUT_META[d.status] ?? STATUT_META.brouillon;
                return (
                  <div key={d.id} className="client-devis-row" onClick={() => onOpen(d)}>
                    <span className="client-devis-title">{d.title || d.destination || "Sans titre"}</span>
                    <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
                    <span className="client-devis-date">{dateShort(d.created_at)}</span>
                    <span className="client-devis-price">{money(d.total_price)}</span>
                    {needsRelance(d)   && <span className="alert-badge alert-relance">Relancer ?</span>}
                    {expireBientot(d)  && <span className="alert-badge alert-expire">Expire bientôt</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MesDevis() {
  const { user, profile, isStudio, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutSuccess = new URLSearchParams(location.search).get("checkout") === "success";
  useEffect(() => { if (checkoutSuccess) refreshProfile(); }, [checkoutSuccess]); // eslint-disable-line

  const [devisList, setDevisList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtre,    setFiltre]    = useState("tous");
  const [periode,   setPeriode]   = useState("mois");
  const [vue,       setVue]       = useState("liste");   // "liste" | "client"
  const [selected,  setSelected]  = useState(null);
  const [updating,  setUpdating]  = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await fetchDevis(user.id);
    if (!error) setDevisList(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Filtrer par période puis par statut
  const start   = periodStart(periode);
  const inPeriod = (d) => new Date(d.created_at) >= start;

  const periodFiltered = devisList.filter(inPeriod);
  const visible = (filtre === "tous" ? periodFiltered : periodFiltered.filter((d) => d.status === filtre))
    .sort((a, b) => {
      const score = (d) => (needsRelance(d) ? 2 : 0) + (expireBientot(d) ? 1 : 0);
      return score(b) - score(a) || new Date(b.created_at) - new Date(a.created_at);
    });

  async function markEnvoye(id, e) {
    e.stopPropagation(); setUpdating(id);
    const { data } = await updateDevisStatus(id, "envoye");
    if (data) { setDevisList((l) => l.map((d) => d.id === id ? { ...d, ...data } : d)); if (selected?.id === id) setSelected({ ...selected, ...data }); }
    setUpdating(null);
  }

  async function markStatus(id, status, e) {
    e.stopPropagation(); setUpdating(id);
    const { data } = await updateDevisStatus(id, status);
    if (data) { setDevisList((l) => l.map((d) => d.id === id ? { ...d, ...data } : d)); if (selected?.id === id) setSelected({ ...selected, ...data }); }
    setUpdating(null);
  }

  async function deleteDevis(id, e) {
    e.stopPropagation();
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    await supabase.from("devis").delete().eq("id", id);
    setDevisList((l) => l.filter((d) => d.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function duplicate(row, e) {
    e.stopPropagation();
    navigate("/", { state: { prefillForm: rowToFormData(row) } });
  }

  async function downloadPdf(row, e) {
    e.stopPropagation();
    if (row.generated_content) await generatePdf(row.generated_content, rowToFormData(row), profile);
  }

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <Nav />

      <main className="mes-devis-main">

        {checkoutSuccess && (
          <div style={{ background: "rgba(40,167,69,.08)", border: "1px solid rgba(40,167,69,.3)", color: "#166534", borderRadius: "10px", padding: "0.9rem 1.25rem", marginBottom: "1.5rem", textAlign: "center", fontWeight: 600, fontSize: "0.9rem" }}>
            ✓ Abonnement activé, bienvenue dans Qovee Pro&nbsp;! Devis illimités.
          </div>
        )}

        {/* ── Header ── */}
        <div className="mes-devis-header">
          <div>
            <h1 className="mes-devis-title">Mes devis</h1>
            <p className="mes-devis-sub">{devisList.length} devis au total</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {isStudio && <button className="md-btn-csv" onClick={() => exportCSV(visible)} title="Exporter en CSV">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              CSV
            </button>}

            <button className="cta-btn mes-devis-new" onClick={() => navigate("/")}>+ Nouveau devis</button>
          </div>
        </div>

        {/* ── Filtres période (Studio) ── */}
        {isStudio && <div className="md-periode-row">
          <div className="mes-devis-filtres" style={{ flex: 1 }}>
            {PERIODES.map((p) => (
              <button key={p.key} className={`filtre-btn${periode === p.key ? " active" : ""}`} onClick={() => setPeriode(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          {isStudio && (
            <div className="md-vue-toggle">
              <button className={`md-vue-btn${vue === "liste"  ? " active" : ""}`} onClick={() => setVue("liste")}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Liste
              </button>
              <button className={`md-vue-btn${vue === "client" ? " active" : ""}`} onClick={() => setVue("client")}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 14a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 7l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Par client
              </button>
            </div>
          )}
        </div>}

        {/* ── Stats & alertes (Studio uniquement) ── */}
        {!loading && isStudio && <StatCards devisList={devisList} periode={periode} />}
        {!loading && isStudio && <AlertSection devisList={periodFiltered} onOpen={setSelected} />}
        {!loading && !isStudio && (
          <div className="studio-upsell">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L10 14.2l-4.8 2.6.9-5.3L2.2 7.7l5.4-.8L10 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>Le tableau de bord de suivi (stats, alertes de relance, vue par client, export CSV) est réservé au forfait <strong>Studio</strong>.</span>
            <a href="/pricing" className="studio-upsell-link">Découvrir Studio →</a>
          </div>
        )}

        {/* ── Filtres statut (vue liste) ── */}
        {vue === "liste" && (
          <div className="mes-devis-filtres" style={{ marginTop: "1.5rem" }}>
            {STATUTS.map((s) => {
              const count = s.key === "tous" ? periodFiltered.length : periodFiltered.filter((d) => d.status === s.key).length;
              return (
                <button key={s.key} className={`filtre-btn${filtre === s.key ? " active" : ""}`} onClick={() => setFiltre(s.key)}>
                  {s.label}{count > 0 && <span className="filtre-count">{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="mes-devis-loading">
            <span className="cta-spinner" style={{ borderColor: "rgba(26,48,64,.2)", borderTopColor: "#C4714A" }}/>
            Chargement…
          </div>
        )}

        {/* ── Vue client ── */}
        {!loading && vue === "client" && (
          <div style={{ marginTop: "1.5rem" }}>
            <ClientView devisList={periodFiltered} onOpen={setSelected} />
          </div>
        )}

        {/* ── Vue liste ── */}
        {!loading && vue === "liste" && visible.length === 0 && (
          <div className="mes-devis-empty">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="#ADBBC6" strokeWidth="2"/>
              <path d="M16 16h16M16 22h16M16 28h10" stroke="#ADBBC6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{filtre === "tous" ? "Aucun devis sur cette période." : `Aucun devis "${filtre}".`}</p>
            <button className="cta-btn" style={{ marginTop: "1rem", width: "auto", padding: "0 1.5rem" }} onClick={() => navigate("/")}>
              Générer mon premier devis →
            </button>
          </div>
        )}

        {!loading && vue === "liste" && visible.length > 0 && (
          <div className="devis-grid">
            {visible.map((row) => {
              const meta    = STATUT_META[row.status] ?? STATUT_META.brouillon;
              const relance = needsRelance(row);
              const expire  = expireBientot(row);
              return (
                <div key={row.id} className={`devis-card${relance ? " devis-card--alert" : ""}`}
                  onClick={() => setSelected(row)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(row)}>

                  <div className="devis-card-top">
                    <span className="devis-card-dest">{row.title || row.destination || "Voyage sans titre"}</span>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      {relance && <span className="alert-badge alert-relance">Relancer ?</span>}
                      {expire  && <span className="alert-badge alert-expire">Expire bientôt</span>}
                      <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
                    </div>
                  </div>

                  <div className="devis-card-ref">
                    <span>{row.devis_number ?? "—"}</span>
                    {row.client_name && <span className="devis-card-client">{row.client_name}</span>}
                  </div>

                  <div className="devis-card-info">
                    {row.destination && (
                      <span><svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.3"/></svg>{row.destination}</span>
                    )}
                    {row.travelers && (
                      <span><svg viewBox="0 0 14 14" fill="none" width="11" height="11"><circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12a4 4 0 018 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>{row.travelers} pers.</span>
                    )}
                  </div>

                  <div className="devis-card-footer">
                    <span className="devis-card-price">{money(row.total_price)}</span>
                    <span className="devis-card-date">{dateShort(row.created_at)}</span>
                  </div>

                  <div className="devis-card-actions" onClick={(e) => e.stopPropagation()}>
                    {row.status === "brouillon" && (
                      <button className="card-action-btn card-action-envoye" onClick={(e) => markEnvoye(row.id, e)} disabled={updating === row.id}>
                        {updating === row.id ? "…" : "✓ Marquer envoyé"}
                      </button>
                    )}
                    {row.status === "envoye" && (
                      <>
                        <button className="card-action-btn card-action-accepte" onClick={(e) => markStatus(row.id, "accepte", e)} disabled={updating === row.id}>✓ Accepté</button>
                        <button className="card-action-btn card-action-refuse"  onClick={(e) => markStatus(row.id, "refuse", e)}  disabled={updating === row.id}>✗ Refusé</button>
                      </>
                    )}
                    <button className="card-action-btn card-action-duplicate" onClick={(e) => duplicate(row, e)}>
                      <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      Dupliquer
                    </button>
                    {row.generated_content && (
                      <button className="card-action-btn card-action-pdf" onClick={(e) => downloadPdf(row, e)}>
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M4 1h6l3 3v9H1V1h3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10V6M5 8l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        PDF
                      </button>
                    )}
                    <button className="card-action-btn card-action-delete" onClick={(e) => deleteDevis(row.id, e)}>
                      <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M2 4h10M5 4V2h4v2M11 4l-.8 8H3.8L3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal ── */}
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
            <div className="modal-actions-bar">
              {selected.status === "brouillon" && (
                <button className="card-action-btn card-action-envoye" onClick={(e) => markEnvoye(selected.id, e)} disabled={updating === selected.id}>
                  {updating === selected.id ? "…" : "✓ Marquer comme envoyé"}
                </button>
              )}
              {selected.status === "envoye" && (
                <>
                  <button className="card-action-btn card-action-accepte" onClick={(e) => markStatus(selected.id, "accepte", e)}>✓ Accepté</button>
                  <button className="card-action-btn card-action-refuse"  onClick={(e) => markStatus(selected.id, "refuse",  e)}>✗ Refusé</button>
                </>
              )}
              <button className="card-action-btn card-action-duplicate" onClick={(e) => duplicate(selected, e)}>Dupliquer</button>
              {selected.generated_content && (
                <button className="card-action-btn card-action-pdf" onClick={(e) => downloadPdf(selected, e)}>Télécharger PDF</button>
              )}
            </div>
            <div className="modal-body">
              {selected.generated_content ? (
                <div className="card result-card" style={{ margin: 0, borderRadius: "12px" }}>
                  <DevisResult
                    devis={selected.generated_content}
                    onReset={() => setSelected(null)}
                    onRegenerate={() => { setSelected(null); navigate("/"); }}
                    onPdf={async () => await generatePdf(selected.generated_content, rowToFormData(selected), profile)}
                  />
                </div>
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "#8A9BA8" }}>Contenu du devis non disponible.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-footer-name"><span className="site-footer-name-q">Q</span>ovee</span>
          </div>
          <div className="site-footer-links">
            {[{ to: "/mentions-legales", label: "Mentions légales" }, { to: "/confidentialite", label: "Confidentialité" }, { to: "/cookies", label: "Cookies" }, { to: "/cgu", label: "CGU" }, { to: "/cgv", label: "CGV" }].map(({ to, label }, i, arr) => (
              <span key={to} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Link to={to} className="site-footer-link">{label}</Link>
                {i < arr.length - 1 && <span style={{ color: "#8A9BA8" }}>·</span>}
              </span>
            ))}
          </div>
          <p className="site-footer-baseline">
            <span style={{ color: "#fff" }}>Décris le voyage. </span>
            <span style={{ color: "var(--terra)" }}>Qovee rédige le devis.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
