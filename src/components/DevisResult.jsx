import React from "react";

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch { return null; }
}

function money(n) {
  return Number(n || 0).toLocaleString("fr-FR") + " €";
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

function WarnIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
      <path d="M9 2L16.5 15H1.5L9 2z" stroke="currentColor" strokeWidth="1.5"
        strokeLinejoin="round"/>
      <path d="M9 7v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Bloc de coût : ligne avec quantité × prix_unitaire ─────────────────
function CostRow({ label, detail, prixUnitaire, quantite, total, unite }) {
  const qtyLabel = quantite && prixUnitaire
    ? `${quantite} ${unite || "×"} ${money(prixUnitaire)}`
    : null;

  return (
    <div className="dr-cost-row">
      <span className="dr-cost-label">{label}</span>
      <span className="dr-cost-detail">{detail}</span>
      {qtyLabel && <span className="dr-cost-qty">{qtyLabel}</span>}
      <span className="dr-cost-amount">{money(total)}</span>
    </div>
  );
}

export default function DevisResult({ devis, onReset, onModify, onPdf }) {
  if (!devis) return null;

  const {
    titre             = "",
    resume            = "",
    itineraire        = [],
    couts             = {},
    total_ttc,
    totalTTC,                    // rétrocompat ancienne structure
    conseilsPratiques = [],
    avertissements    = [],
  } = devis;

  const totalFinal = total_ttc ?? totalTTC ?? 0;

  // Calcul sous-total excursions
  const excursions = Array.isArray(couts.excursions) ? couts.excursions : [];
  const totalExcursions = excursions.reduce((s, e) => s + Number(e.prix || 0), 0);

  return (
    <div className="dr-root">

      {/* ── Header ── */}
      <div className="dr-header">
        <div className="dr-header-eyebrow">Proposition de voyage</div>
        <h2 className="dr-titre">{titre}</h2>
        {resume && <p className="dr-resume">{resume}</p>}
      </div>

      {/* ── Avertissements ── */}
      {avertissements.length > 0 && (
        <div className="dr-section dr-warn-section">
          <div className="dr-section-label dr-warn-label">
            <WarnIcon /> Points d'attention
          </div>
          <ul className="dr-warns">
            {avertissements.map((w, i) => (
              <li key={i} className="dr-warn-item">
                <WarnIcon />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Itinéraire ── */}
      {itineraire.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Programme jour par jour</div>
          <div className="dr-timeline">
            {itineraire.map((jour, i) => {
              const isLast = i === itineraire.length - 1;
              const date   = formatDate(jour.date);
              // Support ancienne structure (matin/apresmidi/soir) ET nouvelle (activites[])
              const activites = Array.isArray(jour.activites)
                ? jour.activites
                : [jour.matin, jour.apresmidi, jour.soir].filter(Boolean);

              return (
                <div key={i} className={`dr-tl-item${isLast ? " dr-tl-last" : ""}`}>
                  <div className="dr-tl-col">
                    <div className="dr-tl-dot" />
                    {!isLast && <div className="dr-tl-line" />}
                  </div>
                  <div className="dr-tl-body">
                    <div className="dr-tl-meta">
                      <span className="dr-tl-jour">Jour {jour.jour}</span>
                      {date && <span className="dr-tl-date">{date}</span>}
                    </div>
                    {jour.titre && <div className="dr-tl-title">{jour.titre}</div>}

                    {/* Activités */}
                    {activites.length > 0 && (
                      <ul className="dr-activites">
                        {activites.map((a, j) => (
                          <li key={j} className="dr-activite-item">
                            <span className="dr-activite-dot" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Hébergement + repas */}
                    {(jour.hebergement || jour.repas) && (
                      <div className="dr-jour-meta">
                        {jour.hebergement && (
                          <span className="dr-jour-hotel">
                            <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                              <rect x="1" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                              <path d="M4 5V3a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
                            </svg>
                            {jour.hebergement}
                          </span>
                        )}
                        {jour.repas && (
                          <span className="dr-jour-repas">
                            <svg viewBox="0 0 14 14" fill="none" width="11" height="11">
                              <path d="M3 2v10M5 2c0 2-2 3-2 5M11 2v3a2 2 0 01-2 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                            {jour.repas}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Détail des coûts ── */}
      {Object.keys(couts).length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Détail des coûts</div>
          <div className="dr-costs">

            {/* Vols */}
            {couts.vols && (
              <CostRow
                label="Vols A/R"
                detail={couts.vols.detail}
                prixUnitaire={couts.vols.prix_unitaire}
                quantite={couts.vols.quantite}
                total={couts.vols.total ?? couts.vols.montant}
                unite="pers."
              />
            )}

            {/* Hébergement */}
            {couts.hebergement && (
              <CostRow
                label="Hébergement"
                detail={couts.hebergement.detail}
                prixUnitaire={couts.hebergement.prix_unitaire}
                quantite={couts.hebergement.quantite}
                total={couts.hebergement.total ?? couts.hebergement.montant}
                unite="nuits"
              />
            )}

            {/* Excursions (array) */}
            {excursions.length > 0 && (
              <div className="dr-cost-row dr-cost-row-group">
                <span className="dr-cost-label">Excursions & activités</span>
                <div className="dr-excursions-list">
                  {excursions.map((exc, i) => (
                    <div key={i} className="dr-excursion-item">
                      <span className="dr-excursion-name">{exc.nom}</span>
                      <span className="dr-cost-amount">{money(exc.prix)}</span>
                    </div>
                  ))}
                  {excursions.length > 1 && (
                    <div className="dr-excursion-subtotal">
                      <span>Sous-total excursions</span>
                      <span className="dr-cost-amount">{money(totalExcursions)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Excursions (ancienne structure — rétrocompat) */}
            {!Array.isArray(couts.excursions) && couts.excursions && (
              <CostRow
                label="Excursions & activités"
                detail={couts.excursions.detail}
                total={couts.excursions.total ?? couts.excursions.montant}
              />
            )}

            {/* Transferts */}
            {couts.transferts && (
              <CostRow
                label="Transferts"
                detail={couts.transferts.detail}
                total={couts.transferts.total ?? couts.transferts.montant}
              />
            )}

            {/* Assurance */}
            {couts.assurance && (
              <CostRow
                label="Assurance voyage"
                detail={couts.assurance.detail}
                total={couts.assurance.total ?? couts.assurance.montant}
              />
            )}

            {/* Divers (rétrocompat ancienne structure) */}
            {couts.divers && (
              <CostRow
                label="Divers & assurance"
                detail={couts.divers.detail}
                total={couts.divers.total ?? couts.divers.montant}
              />
            )}
          </div>

          {/* Total TTC */}
          {totalFinal > 0 && (
            <div className="dr-total">
              <span className="dr-total-label">Total TTC</span>
              <span className="dr-total-amount">{money(totalFinal)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Conseils pratiques ── */}
      {conseilsPratiques.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Bon à savoir</div>
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
