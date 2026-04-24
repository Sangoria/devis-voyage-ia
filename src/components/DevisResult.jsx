import React, { useState } from "react";
import { updateDevisContent } from "../lib/supabase";
import { normalizeDevis } from "../lib/normalizeDevis";
import DevisFeedback from "./DevisFeedback";

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

function CostRow({ ligne }) {
  const { label, detail, prixUnitaire, quantite, unite, montant } = ligne;
  const qtyLabel = quantite && prixUnitaire
    ? `${quantite} ${unite || "×"} ${money(prixUnitaire)}`
    : null;
  return (
    <div className="dr-cost-row">
      <span className="dr-cost-label">{label}</span>
      {detail && <span className="dr-cost-detail">{detail}</span>}
      {qtyLabel && <span className="dr-cost-qty">{qtyLabel}</span>}
      <span className="dr-cost-amount">{money(montant)}</span>
    </div>
  );
}

// ── Mode lecture ──────────────────────────────────────────────────────────────
function ReadView({ normalized, onEdit, onRegenerate, onPdf, onReset, savedDevisId }) {
  const { titre, resume, itineraire, lignes, total_ttc, conseilsPratiques, avertissements } = normalized;

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
                    {jour.activites.length > 0 && (
                      <ul className="dr-activites">
                        {jour.activites.map((a, j) => (
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

      {lignes.length > 0 && (
        <div className="dr-section">
          <div className="dr-section-label">Détail des coûts</div>
          <div className="dr-costs">
            {lignes.map((l) => <CostRow key={l.id} ligne={l} />)}
          </div>
          {total_ttc > 0 && (
            <div className="dr-total">
              <span className="dr-total-label">Total TTC</span>
              <span className="dr-total-amount">{money(total_ttc)}</span>
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

      <DevisFeedback devisId={savedDevisId} />

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
function EditView({ normalized, raw, savedDevisId, onCancel, onSaved, onPdf }) {
  const [draft, setDraft] = useState({
    titre: normalized.titre,
    resume: normalized.resume,
    itineraire: normalized.itineraire,
    lignes: normalized.lignes,
    conseilsPratiques: [...normalized.conseilsPratiques],
  });
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const total = draft.lignes.reduce((s, l) => s + Number(l.montant || 0), 0);

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
      lignes: [...d.lignes, { id: `custom_${Date.now()}`, label: "Nouvelle ligne", detail: null, prixUnitaire: null, quantite: null, unite: null, montant: 0 }],
    }));
  }
  function removeLigne(i) {
    setDraft((d) => ({ ...d, lignes: d.lignes.filter((_, j) => j !== i) }));
  }

  function buildUpdated() {
    return {
      ...raw,
      titre: draft.titre,
      resume: draft.resume,
      itineraire: draft.itineraire,
      lignes_editees: draft.lignes,
      conseilsPratiques: draft.conseilsPratiques,
      total_ttc: total,
    };
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const updated = buildUpdated();
    if (savedDevisId) {
      const { error } = await updateDevisContent(savedDevisId, updated);
      if (error) { setSaveMsg("Erreur lors de la sauvegarde."); setSaving(false); return; }
    }
    onSaved(updated);
    setSaveMsg("Modifications sauvegardées ✓");
    setSaving(false);
  }

  return (
    <div className="dr-root">
      <div className="dr-edit-banner">
        <EditIcon /> Mode édition — les modifications sont appliquées au PDF
      </div>

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

      {saveMsg && (
        <div className="dr-save-msg" style={{ color: saveMsg.includes("Erreur") ? "#c0392b" : "var(--terra)" }}>
          {saveMsg}
        </div>
      )}

      <div className="dr-actions">
        <button className="dr-btn dr-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde…" : "Sauvegarder les modifications"}
        </button>
        <button className="dr-btn dr-btn-secondary" onClick={() => onPdf(buildUpdated())}>
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
  const [raw, setRaw] = useState(devis);

  const normalized = normalizeDevis(raw);
  if (!normalized) return null;

  function handleSaved(updated) {
    setRaw(updated);
    if (onSaved) onSaved(updated);
    setEditMode(false);
  }

  if (editMode) {
    return (
      <EditView
        normalized={normalized}
        raw={raw}
        savedDevisId={savedDevisId}
        onCancel={() => setEditMode(false)}
        onSaved={handleSaved}
        onPdf={onPdf}
      />
    );
  }

  return (
    <ReadView
      normalized={normalized}
      savedDevisId={savedDevisId}
      onEdit={() => setEditMode(true)}
      onRegenerate={onRegenerate}
      onPdf={() => onPdf(raw)}
      onReset={onReset}
    />
  );
}
