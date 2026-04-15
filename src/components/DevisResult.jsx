import React from "react";

const COST_META = {
  vols:        { label: "Vols A/R",              icon: "✈" },
  hebergement: { label: "Hébergement",            icon: "🏨" },
  excursions:  { label: "Excursions & activités", icon: "🗺" },
  transferts:  { label: "Transferts",             icon: "🚌" },
  divers:      { label: "Divers & assurance",     icon: "🛡" },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch {
    return null;
  }
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
      <rect x="3" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 1v4h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M3 12h12M9 15v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
      <path d="M13 2.5l2.5 2.5-9 9H4V11.5l9-9z" stroke="currentColor" strokeWidth="1.5"
        strokeLinejoin="round"/>
    </svg>
  );
}

export default function DevisResult({ devis, onReset, onModify, onPdf }) {
  if (!devis) return null;

  const {
    titre,
    resume,
    itineraire = [],
    couts = {},
    totalTTC,
    conseilsPratiques = [],
  } = devis;

  const costEntries = Object.entries(couts);

  return (
    <div className="dr-root">

      {/* ── Header ── */}
      <div className="dr-header">
        <div className="dr-header-eyebrow">Devis voyage</div>
        <h2 className="dr-titre">{titre}</h2>
        {resume && <p className="dr-resume">{resume}</p>}
      </div>

      {/* ── Itinéraire ── */}
      {itineraire.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Itinéraire</div>
          <div className="dr-timeline">
            {itineraire.map((jour, i) => {
              const isLast = i === itineraire.length - 1;
              const date = formatDate(jour.date);
              return (
                <div key={i} className={`dr-tl-item${isLast ? " dr-tl-last" : ""}`}>
                  {/* Dot + line */}
                  <div className="dr-tl-col">
                    <div className="dr-tl-dot" />
                    {!isLast && <div className="dr-tl-line" />}
                  </div>
                  {/* Content */}
                  <div className="dr-tl-body">
                    <div className="dr-tl-meta">
                      <span className="dr-tl-jour">Jour {jour.jour}</span>
                      {date && <span className="dr-tl-date">{date}</span>}
                    </div>
                    {jour.titre && (
                      <div className="dr-tl-title">{jour.titre}</div>
                    )}
                    <div className="dr-tl-slots">
                      {jour.matin && (
                        <div className="dr-slot">
                          <span className="dr-slot-label">Matin</span>
                          <span className="dr-slot-text">{jour.matin}</span>
                        </div>
                      )}
                      {jour.apresmidi && (
                        <div className="dr-slot">
                          <span className="dr-slot-label">Après-midi</span>
                          <span className="dr-slot-text">{jour.apresmidi}</span>
                        </div>
                      )}
                      {jour.soir && (
                        <div className="dr-slot">
                          <span className="dr-slot-label">Soir</span>
                          <span className="dr-slot-text">{jour.soir}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Coûts ── */}
      {costEntries.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Détail des coûts</div>
          <div className="dr-costs">
            {costEntries.map(([key, val]) => {
              const meta = COST_META[key] ?? { label: key, icon: "•" };
              return (
                <div key={key} className="dr-cost-row">
                  <span className="dr-cost-icon">{meta.icon}</span>
                  <span className="dr-cost-label">{meta.label}</span>
                  <span className="dr-cost-detail">{val.detail}</span>
                  <span className="dr-cost-amount">
                    {Number(val.montant).toLocaleString("fr-FR")} €
                  </span>
                </div>
              );
            })}
          </div>
          {totalTTC !== undefined && (
            <div className="dr-total">
              <span className="dr-total-label">Total TTC</span>
              <span className="dr-total-amount">
                {Number(totalTTC).toLocaleString("fr-FR")} €
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Conseils pratiques ── */}
      {conseilsPratiques.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Conseils pratiques</div>
          <ul className="dr-conseils">
            {conseilsPratiques.map((c, i) => (
              <li key={i}>
                <span className="dr-conseil-arrow">→</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="dr-actions">
        <button className="dr-btn dr-btn-primary" onClick={onPdf}>
          <PdfIcon />
          Télécharger le PDF
        </button>
        <button className="dr-btn dr-btn-secondary" onClick={onModify}>
          <EditIcon />
          Modifier le devis
        </button>
        <button className="dr-btn dr-btn-ghost" onClick={onReset}>
          Nouveau devis
        </button>
      </div>

    </div>
  );
}
