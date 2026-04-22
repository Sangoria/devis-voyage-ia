import React, { useState } from "react";
import { updateDevisContent } from "../lib/supabase";

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

// Aplatit les couts structurés en tableau de lignes éditables
function flattenCouts(couts) {
  const lignes = [];
  if (couts.vols)
    lignes.push({ id: "vols", label: "Vols A/R", montant: Number(couts.vols.total ?? couts.vols.montant ?? 0) });
  if (couts.hebergement)
    lignes.push({ id: "hebergement", label: "Hébergement", montant: Number(couts.hebergement.total ?? couts.hebergement.montant ?? 0) });
  if (Array.isArray(couts.excursions)) {
    couts.excursions.forEach((exc, i) =>
      lignes.push({ id: `exc_${i}`, label: exc.nom || "Excursion", montant: Number(exc.prix ?? 0) })
    );
  } else if (couts.excursions) {
    lignes.push({ id: "excursions", label: "Excursions & activités", montant: Number(couts.excursions.total ?? couts.excursions.montant ?? 0) });
  }
  if (couts.transferts)
    lignes.push({ id: "transferts", label: "Transferts", montant: Number(couts.transferts.total ?? couts.transferts.montant ?? 0) });
  if (couts.assurance)
    lignes.push({ id: "assurance", label: "Assurance voyage", montant: Number(couts.assurance.total ?? couts.assurance.montant ?? 0) });
  if (couts.divers)
    lignes.push({ id: "divers", label: "Divers & assurance", montant: Number(couts.divers.total ?? couts.divers.montant ?? 0) });
  return lignes;
}

function buildDraft(devis) {
  const couts = devis.couts ?? {};
  const lignes = devis.lignes_editees ?? flattenCouts(couts);
  return {
    titre    : devis.titre ?? "",
    resume   : devis.resume ?? "",
    itineraire: (devis.itineraire ?? []).map((j) => ({
      ...j,
      titre      : j.titre ?? "",
      activites  : Array.isArray(j.activites)
        ? j.activites
        : [j.matin, j.apresmidi, j.soir].filter(Boolean),
    })),
    lignes,
    conseilsPratiques: [...(devis.conseilsPratiques ?? [])],
  };
}

// ── Mode lecture ──────────────────────────────────────────────────────────────
function ReadView({ devis, onEdit, onRegenerate, onPdf, onReset }) {
  const {
    titre = "", resume = "", itineraire = [], couts = {},
    total_ttc, totalTTC, conseilsPratiques = [], avertissements = [],
    lignes_editees,
  } = devis;

  const totalFinal = total_ttc ?? totalTTC ?? 0;
  const excursions = Array.isArray(couts.excursions) ? couts.excursions : [];
  const totalExcursions = excursions.reduce((s, e) => s + Number(e.prix || 0), 0);

  return (
    <div className="dr-root">
      <div className="dr-header">
        <div className="dr-header-eyebrow">Proposition de voyage</div>
        <h2 className="dr-titre">{titre}</h2>
        {resume && <p className="dr-resume">{resume}</p>}
      </div>

      {avertissements.length > 0 && (
        <div className="dr-section dr-warn-section">
          <div className="dr-section-label dr-warn-label"><WarnIcon /> Points d'attention</div>
          <ul className="dr-warns">
            {avertissements.map((w, i) => (
              <li key={i} className="dr-warn-item"><WarnIcon /><span>{w}</span></li>
            ))}
          </ul>
        </div>
      )}

      {itineraire.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Programme jour par jour</div>
          <div className="dr-timeline">
            {itineraire.map((jour, i) => {
              const isLast = i === itineraire.length - 1;
              const date   = formatDate(jour.date);
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

      {/* Coûts — lignes éditées ou structure originale */}
      {(lignes_editees || Object.keys(couts).length > 0) && (
        <div className="dr-section">
          <div className="dr-section-label">Détail des coûts</div>
          <div className="dr-costs">
            {lignes_editees ? (
              lignes_editees.map((l, i) => (
                <div key={i} className="dr-cost-row">
                  <span className="dr-cost-label">{l.label}</span>
                  <span className="dr-cost-amount">{money(l.montant)}</span>
                </div>
              ))
            ) : (
              <>
                {couts.vols && <CostRow label="Vols A/R" detail={couts.vols.detail} prixUnitaire={couts.vols.prix_unitaire} quantite={couts.vols.quantite} total={couts.vols.total ?? couts.vols.montant} unite="pers." />}
                {couts.hebergement && <CostRow label="Hébergement" detail={couts.hebergement.detail} prixUnitaire={couts.hebergement.prix_unitaire} quantite={couts.hebergement.quantite} total={couts.hebergement.total ?? couts.hebergement.montant} unite="nuits" />}
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
                {!Array.isArray(couts.excursions) && couts.excursions && <CostRow label="Excursions & activités" detail={couts.excursions.detail} total={couts.excursions.total ?? couts.excursions.montant} />}
                {couts.transferts && <CostRow label="Transferts" detail={couts.transferts.detail} total={couts.transferts.total ?? couts.transferts.montant} />}
                {couts.assurance && <CostRow label="Assurance voyage" detail={couts.assurance.detail} total={couts.assurance.total ?? couts.assurance.montant} />}
                {couts.divers && <CostRow label="Divers & assurance" detail={couts.divers.detail} total={couts.divers.total ?? couts.divers.montant} />}
              </>
            )}
          </div>
          {totalFinal > 0 && (
            <div className="dr-total">
              <span className="dr-total-label">Total TTC</span>
              <span className="dr-total-amount">{money(totalFinal)}</span>
            </div>
          )}
        </div>
      )}

      {conseilsPratiques.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Bon à savoir</div>
          <ul className="dr-conseils">
            {conseilsPratiques.map((c, i) => (
              <li key={i}><span className="dr-conseil-arrow">→</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="dr-actions">
        <button className="dr-btn dr-btn-primary" onClick={onPdf}><PdfIcon />Télécharger le PDF</button>
        <button className="dr-btn dr-btn-secondary" onClick={onEdit}><EditIcon />Éditer le devis</button>
        <button className="dr-btn dr-btn-secondary" onClick={onRegenerate}>
          <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
            <path d="M1 9a8 8 0 0113.5-5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M17 9a8 8 0 01-13.5 5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 2.5l1 1.7-1.8.8M4 15.5l-1-1.7 1.8-.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Régénérer avec l'IA
        </button>
        <button className="dr-btn dr-btn-ghost" onClick={onReset}>Nouveau devis</button>
      </div>
    </div>
  );
}

// ── Mode édition ──────────────────────────────────────────────────────────────
function EditView({ devis, savedDevisId, onCancel, onSaved, onPdf }) {
  const [draft,   setDraft]   = useState(() => buildDraft(devis));
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const total = draft.lignes.reduce((s, l) => s + Number(l.montant || 0), 0);

  // Itinéraire
  function setJourTitre(i, val) {
    setDraft((d) => {
      const it = [...d.itineraire];
      it[i] = { ...it[i], titre: val };
      return { ...d, itineraire: it };
    });
  }
  function setJourActivites(i, val) {
    setDraft((d) => {
      const it = [...d.itineraire];
      it[i] = { ...it[i], activites: val.split("\n") };
      return { ...d, itineraire: it };
    });
  }

  // Lignes de coûts
  function setLigne(i, field, val) {
    setDraft((d) => {
      const lignes = [...d.lignes];
      lignes[i] = { ...lignes[i], [field]: field === "montant" ? Number(val) || 0 : val };
      return { ...d, lignes };
    });
  }
  function addLigne() {
    setDraft((d) => ({
      ...d,
      lignes: [...d.lignes, { id: `custom_${Date.now()}`, label: "Nouvelle ligne", montant: 0 }],
    }));
  }
  function removeLigne(i) {
    setDraft((d) => ({ ...d, lignes: d.lignes.filter((_, j) => j !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const updated = {
      ...devis,
      titre              : draft.titre,
      resume             : draft.resume,
      itineraire         : draft.itineraire,
      lignes_editees     : draft.lignes,
      conseilsPratiques  : draft.conseilsPratiques,
      total_ttc          : total,
    };
    if (savedDevisId) {
      const { error } = await updateDevisContent(savedDevisId, updated);
      if (error) { setSaveMsg("Erreur lors de la sauvegarde."); setSaving(false); return; }
    }
    onSaved(updated);
    setSaveMsg("Modifications sauvegardées ✓");
    setSaving(false);
  }

  function handlePdfEdit() {
    const updated = {
      ...devis,
      titre             : draft.titre,
      resume            : draft.resume,
      itineraire        : draft.itineraire,
      lignes_editees    : draft.lignes,
      conseilsPratiques : draft.conseilsPratiques,
      total_ttc         : total,
    };
    onPdf(updated);
  }

  return (
    <div className="dr-root">

      {/* Bandeau mode édition */}
      <div className="dr-edit-banner">
        <EditIcon /> Mode édition — les modifications sont appliquées au PDF
      </div>

      {/* Titre & résumé */}
      <div className="dr-section">
        <div className="dr-section-label">En-tête du devis</div>
        <div className="dr-edit-field">
          <label className="dr-edit-label">Titre</label>
          <input className="dr-edit-input" value={draft.titre}
            onChange={(e) => setDraft((d) => ({ ...d, titre: e.target.value }))} />
        </div>
        <div className="dr-edit-field" style={{ marginTop: "0.75rem" }}>
          <label className="dr-edit-label">Résumé</label>
          <textarea className="dr-edit-textarea" rows={3} value={draft.resume}
            onChange={(e) => setDraft((d) => ({ ...d, resume: e.target.value }))} />
        </div>
      </div>

      {/* Itinéraire */}
      {draft.itineraire.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Programme jour par jour</div>
          {draft.itineraire.map((jour, i) => (
            <div key={i} className="dr-edit-jour">
              <div className="dr-edit-jour-header">Jour {jour.jour}</div>
              <div className="dr-edit-field">
                <label className="dr-edit-label">Titre du jour</label>
                <input className="dr-edit-input" value={jour.titre}
                  onChange={(e) => setJourTitre(i, e.target.value)} />
              </div>
              <div className="dr-edit-field" style={{ marginTop: "0.5rem" }}>
                <label className="dr-edit-label">Activités <span style={{ opacity: 0.5, fontWeight: 400 }}>(une par ligne)</span></label>
                <textarea className="dr-edit-textarea" rows={3}
                  value={(jour.activites || []).join("\n")}
                  onChange={(e) => setJourActivites(i, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lignes de coûts */}
      <div className="dr-section">
        <div className="dr-section-label">Détail des coûts</div>
        <div className="dr-edit-lignes">
          {draft.lignes.map((l, i) => (
            <div key={l.id} className="dr-edit-ligne">
              <input className="dr-edit-input dr-edit-ligne-label"
                value={l.label}
                onChange={(e) => setLigne(i, "label", e.target.value)}
                placeholder="Libellé" />
              <div className="dr-edit-ligne-amount">
                <input className="dr-edit-input dr-edit-input-number"
                  type="number" min="0"
                  value={l.montant}
                  onChange={(e) => setLigne(i, "montant", e.target.value)} />
                <span className="dr-edit-currency">€</span>
              </div>
              <button className="dr-edit-remove" onClick={() => removeLigne(i)} title="Supprimer">
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                  <path d="M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
          <button className="dr-edit-add" onClick={addLigne}>
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Ajouter une ligne
          </button>
        </div>
        <div className="dr-total">
          <span className="dr-total-label">Total TTC</span>
          <span className="dr-total-amount">{money(total)}</span>
        </div>
      </div>

      {/* Message sauvegarde */}
      {saveMsg && (
        <div className="dr-save-msg" style={{ color: saveMsg.includes("Erreur") ? "#c0392b" : "var(--terra)" }}>
          {saveMsg}
        </div>
      )}

      {/* Actions */}
      <div className="dr-actions">
        <button className="dr-btn dr-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde…" : "Sauvegarder les modifications"}
        </button>
        <button className="dr-btn dr-btn-secondary" onClick={handlePdfEdit}>
          <PdfIcon /> PDF avec modifications
        </button>
        <button className="dr-btn dr-btn-ghost" onClick={onCancel}>Annuler</button>
      </div>

    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DevisResult({ devis, onReset, onRegenerate, onPdf, onSaved, savedDevisId }) {
  const [editMode, setEditMode] = useState(false);
  const [current,  setCurrent]  = useState(devis);

  if (!current) return null;

  function handleSaved(updated) {
    setCurrent(updated);
    if (onSaved) onSaved(updated);
    setEditMode(false);
  }

  function handlePdfEdit(updated) {
    onPdf(updated);
  }

  if (editMode) {
    return (
      <EditView
        devis={current}
        savedDevisId={savedDevisId}
        onCancel={() => setEditMode(false)}
        onSaved={handleSaved}
        onPdf={handlePdfEdit}
      />
    );
  }

  return (
    <ReadView
      devis={current}
      onEdit={() => setEditMode(true)}
      onRegenerate={onRegenerate}
      onPdf={() => onPdf(current)}
      onReset={onReset}
    />
  );
}
