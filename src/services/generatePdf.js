import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Palette Qovee ────────────────────────────────────────────────────
const OCEAN  = [26,  48,  64];
const GOLD   = [184, 150, 90];
const SAND   = [242, 235, 224];
const MIST   = [138, 155, 168];
const CREAM  = [250, 247, 242];
const BORDER = [228, 217, 206];
const WHITE  = [255, 255, 255];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

function lighten(rgb, amount = 0.75) {
  return rgb.map((c) => Math.round(c + (255 - c) * amount));
}

// ── Constantes de mise en page ───────────────────────────────────────
const W      = 210;
const H      = 297;
const MARGIN = 18;
const CW     = W - MARGIN * 2;   // largeur du contenu
const SAFE_Y = H - 26;            // zone sûre avant footer
const FOOT_Y = H - 18;            // y de début footer

// ── Helpers ──────────────────────────────────────────────────────────
function money(n) {
  return Number(n || 0).toLocaleString("fr-FR") + " \u20AC";
}

function longDate(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return str; }
}

function shortDate(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return str; }
}

/** Ajoute une page et retourne le nouveau y (MARGIN). */
function addPage(doc) {
  doc.addPage();
  return MARGIN;
}

/** Retourne y inchangé ou ajoute une page si on dépasse SAFE_Y. */
function guard(doc, y, needed) {
  return y + needed > SAFE_Y ? addPage(doc) : y;
}

/** Dessine la barre de section (fond Ocean + label Gold). Retourne le y après la barre. */
function sectionBar(doc, y, label) {
  doc.setFillColor(...OCEAN);
  doc.rect(MARGIN, y, CW, 8.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text(label, MARGIN + 4, y + 5.7);
  return y + 13;
}

/** Dessine le pied de page sur la page courante. */
function drawFooter(doc, pageNum, totalPages, ref) {
  doc.setFillColor(...OCEAN);
  doc.rect(0, FOOT_Y, W, H - FOOT_Y, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MIST);
  doc.text(`Ref. ${ref}`, MARGIN, FOOT_Y + 7);
  doc.text(`Page ${pageNum} / ${totalPages}`, W - MARGIN, FOOT_Y + 7, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(80, 100, 115);
  doc.text("Devis genere avec Qovee  \u00B7  qovee.fr  \u00B7  29 \u20AC/mois", W / 2, FOOT_Y + 13, { align: "center" });
}

// ── Helpers image ────────────────────────────────────────────────────
async function loadImageAsDataUrl(url) {
  const res  = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ── Générateur principal ─────────────────────────────────────────────
export async function generatePdf(devis, formData = {}, profile = {}) {
  const {
    titre             = "Voyage sur-mesure",
    resume            = "",
    itineraire        = [],
    couts             = {},
    total_ttc,
    totalTTC,
    conseilsPratiques = [],
    avertissements    = [],
  } = devis;
  const totalFinal = total_ttc ?? totalTTC ?? 0;

  const {
    destination      = "",
    voyageurs        = "",
    typeGroupe       = "",
    dateDebut        = "",
    dateFin          = "",
    typesExperience  = [],
    budgetMode       = "total",
  } = formData;

  const TERRA   = hexToRgb(profile?.accent_color || "#C4714A");
  const TERRA_L = lighten(TERRA, 0.75);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const ref   = `QOV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const today = longDate(new Date().toISOString().split("T")[0]);

  // Durée
  let duree = "";
  if (dateDebut && dateFin) {
    const d = Math.round((new Date(dateFin) - new Date(dateDebut)) / 86400000);
    if (d > 0) duree = `${d} nuit${d > 1 ? "s" : ""}`;
  } else if (itineraire.length > 0) {
    duree = `${itineraire.length} jour${itineraire.length > 1 ? "s" : ""}`;
  }

  // ── EN-TÊTE PAGE 1 ──────────────────────────────────────────────────

  const agencyName  = profile?.agency_name   || "";
  const contactName = profile?.contact_name  || "";
  const phone       = profile?.phone         || "";
  const website     = profile?.website       || "";
  const logoUrl     = profile?.logo_url      || null;

  // Fond Ocean
  doc.setFillColor(...OCEAN);
  doc.rect(0, 0, W, 62, "F");

  // Bande accent en bas du header
  doc.setFillColor(...TERRA);
  doc.rect(0, 59, W, 3, "F");

  // Logo agence (fallback: favicon Qovee)
  try {
    const src = logoUrl || "/favicon.png";
    const imgData = await loadImageAsDataUrl(src);
    doc.addImage(imgData, "PNG", MARGIN, 9, 26, 26);
  } catch {
    try {
      const fb = await loadImageAsDataUrl("/favicon.png");
      doc.addImage(fb, "PNG", MARGIN, 9, 26, 26);
    } catch { /* pas de logo */ }
  }

  const nameX = MARGIN + 30;

  // Nom de l'agence
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(agencyName || "Mon Agence", nameX, 19);

  // Ligne contact : responsable · téléphone · site web
  const contactParts = [contactName, phone, website].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MIST);
    doc.text(contactParts.join("  \u00B7  "), nameX, 27);
  }

  // Mention Qovee discrète
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(60, 85, 100);
  doc.text("Propulse par Qovee", nameX, 34);

  // "Proposition de voyage"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(...SAND);
  doc.text("Proposition de voyage", MARGIN, 43);

  // Titre du devis (court)
  const titreShort = titre.length > 58 ? titre.substring(0, 58) + "..." : titre;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...TERRA);
  doc.text(titreShort, MARGIN, 52);

  // Ref + date (haut droite)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MIST);
  doc.text(`Ref. ${ref}`, W - MARGIN, 18, { align: "right" });
  doc.text(`Emis le ${today}`, W - MARGIN, 24.5, { align: "right" });

  // Badge "Valable 30 jours"
  doc.setFillColor(...TERRA);
  doc.roundedRect(W - MARGIN - 38, 44.5, 38, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text("Valable 30 jours", W - MARGIN - 19, 50.2, { align: "center" });

  let y = 72;

  // ── BLOC RÉSUMÉ DU VOYAGE ────────────────────────────────────────────

  // Calcul de la hauteur du bloc
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const resumeLines = doc.splitTextToSize(resume || "", CW - 20);

  const metaItems = [
    destination && `Destination : ${destination}`,
    duree       && `Duree       : ${duree}`,
    voyageurs   && `Voyageurs   : ${typeGroupe ? typeGroupe + "  -  " : ""}${voyageurs} pers.`,
    dateDebut   && `Depart      : ${shortDate(dateDebut)}`,
    dateFin     && `Retour      : ${shortDate(dateFin)}`,
  ].filter(Boolean);

  const expLine = typesExperience.length > 0 ? typesExperience.join("  -  ") : "";

  const boxH = 10
    + (metaItems.length > 0 ? Math.ceil(metaItems.length / 2) * 7 + 5 : 0)
    + (expLine ? 9 : 0)
    + (resume ? resumeLines.length * 5.2 + 4 : 0)
    + 6;

  // Fond Cream + bordure
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, "FD");

  // Barre Terracotta gauche
  doc.setFillColor(...TERRA);
  doc.roundedRect(MARGIN, y, 3.5, boxH, 1.5, 1.5, "F");

  const bx = MARGIN + 10;
  let by = y + 8;

  // Grille méta (2 colonnes)
  if (metaItems.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...OCEAN);
    metaItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      doc.text(item, bx + col * (CW / 2 - 5), by + row * 7);
    });
    by += Math.ceil(metaItems.length / 2) * 7 + 3;

    // Séparateur
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(bx, by, W - MARGIN - 4, by);
    by += 5;
  }

  // Types d'expérience
  if (expLine) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...MIST);
    doc.text("Experience : " + expLine, bx, by);
    by += 8;
  }

  // Résumé texte
  if (resume) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...OCEAN);
    doc.text(resumeLines, bx, by);
  }

  y += boxH + 12;

  // ── PROGRAMME DÉTAILLÉ ───────────────────────────────────────────────

  if (itineraire.length > 0) {
    y = guard(doc, y, 20);
    y = sectionBar(doc, y, "PROGRAMME DETAILLE - ITINERAIRE JOUR PAR JOUR");

    itineraire.forEach((jour, i) => {
      // Support nouvelle structure (activites[]) ET ancienne (matin/apresmidi/soir)
      const rawActivites = Array.isArray(jour.activites)
        ? jour.activites.map((a) => ({ label: null, text: a }))
        : [
            jour.matin     && { label: "MATIN",      text: jour.matin },
            jour.apresmidi && { label: "APRES-MIDI", text: jour.apresmidi },
            jour.soir      && { label: "SOIR",       text: jour.soir },
          ].filter(Boolean);
      const slots = rawActivites;

      // Estimation hauteur du jour
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      let estH = 10;
      slots.forEach((s) => {
        estH += doc.splitTextToSize(s.text, CW - 36).length * 5.2 + 5;
      });

      y = guard(doc, y, estH);

      // Ligne du jour (fond bleu-gris clair)
      doc.setFillColor(236, 242, 246);
      doc.rect(MARGIN, y, CW, 8.5, "F");

      // Point Terracotta
      doc.setFillColor(...TERRA);
      doc.circle(MARGIN + 6, y + 4.2, 2.5, "F");

      // "JOUR X"
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...TERRA);
      doc.text(`JOUR ${jour.jour}`, MARGIN + 11.5, y + 5.5);

      // Date
      const ds = shortDate(jour.date);
      if (ds) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...MIST);
        doc.text(ds, MARGIN + 32, y + 5.5);
      }

      // Titre du jour
      if (jour.titre) {
        const tx = ds ? MARGIN + 74 : MARGIN + 32;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...OCEAN);
        const t = jour.titre.length > 50 ? jour.titre.substring(0, 50) + "..." : jour.titre;
        doc.text(t, tx, y + 5.5);
      }

      y += 10;

      // Slots matin / après-midi / soir
      // Hébergement + repas (nouvelle structure)
      if (jour.hebergement || jour.repas) {
        y = guard(doc, y, 7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GOLD);
        const hotelLine = [jour.hebergement, jour.repas].filter(Boolean).join("  ·  ");
        doc.text(hotelLine, MARGIN + 4, y + 3);
        y += 7;
      }

      slots.forEach((slot) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        // Pour activites[], on réduit la largeur selon si on a un label ou non
        const textX   = slot.label ? MARGIN + 26 : MARGIN + 8;
        const textW   = slot.label ? CW - 36 : CW - 14;
        const lines   = doc.splitTextToSize(slot.text, textW);
        const slotH   = lines.length * 5.2 + 4;

        y = guard(doc, y, slotH);

        if (slot.label) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(...TERRA);
          doc.text(slot.label, MARGIN + 4, y + 4);
        } else {
          // Puce pour les activites[]
          doc.setFillColor(...TERRA);
          doc.circle(MARGIN + 4.5, y + 2.5, 1.2, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...OCEAN);
        doc.text(lines, textX, y + 4);

        y += slotH;
      });

      // Séparateur entre jours
      if (i < itineraire.length - 1) {
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, y + 2, W - MARGIN, y + 2);
        y += 6;
      }
    });

    y += 10;
  }

  // ── TABLEAU DES PRIX ─────────────────────────────────────────────────

  // Construire les lignes du tableau des prix (nouvelle structure + rétrocompat)
  const tableRows = [];

  const addRow = (poste, detail, qtyLabel, total) => {
    tableRows.push([poste, detail || "-", qtyLabel || "-", money(total || 0)]);
  };

  if (couts.vols) {
    const v = couts.vols;
    const qty = v.quantite && v.prix_unitaire ? `${v.quantite} × ${money(v.prix_unitaire)}` : "-";
    addRow("Vols aller-retour", v.detail, qty, v.total ?? v.montant);
  }
  if (couts.hebergement) {
    const h = couts.hebergement;
    const qty = h.quantite && h.prix_unitaire ? `${h.quantite} nuits × ${money(h.prix_unitaire)}` : "-";
    addRow("Hebergement", h.detail, qty, h.total ?? h.montant);
  }

  // Excursions : array (nouvelle structure)
  if (Array.isArray(couts.excursions)) {
    couts.excursions.forEach((exc, i) => {
      addRow(
        i === 0 ? "Excursions & activites" : "",
        exc.nom,
        "1 × " + money(exc.prix),
        exc.prix
      );
    });
  } else if (couts.excursions) {
    const e = couts.excursions;
    addRow("Excursions & activites", e.detail, "-", e.total ?? e.montant);
  }

  if (couts.transferts) {
    const t = couts.transferts;
    addRow("Transferts", t.detail, "-", t.total ?? t.montant);
  }
  if (couts.assurance) {
    const a = couts.assurance;
    addRow("Assurance voyage", a.detail, "-", a.total ?? a.montant);
  }
  if (couts.divers) {
    const d = couts.divers;
    addRow("Divers & assurance", d.detail, "-", d.total ?? d.montant);
  }

  if (tableRows.length > 0) {
    y = guard(doc, y, 20);

    autoTable(doc, {
      startY: y,
      head: [["Poste", "Detail", "Qte x P.U.", "Montant"]],
      body: tableRows,
      foot: [[
        {
          content: "TOTAL TTC",
          styles: { fontStyle: "bold", textColor: OCEAN, fontSize: 10 },
        },
        {
          content: budgetMode === "personne" ? "Prix par personne" : "Prix total groupe",
          styles: { textColor: MIST, fontStyle: "italic" },
          colSpan: 2,
        },
        {
          content: money(totalFinal),
          styles: { fontStyle: "bold", textColor: TERRA, fontSize: 12 },
        },
      ]],
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
        textColor: OCEAN,
        lineColor: BORDER,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: OCEAN,
        textColor: GOLD,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 4.5, right: 4, bottom: 4.5, left: 4 },
      },
      footStyles: {
        fillColor: TERRA_L,
        lineWidth: 0,
        cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 46 },
        1: { textColor: MIST },
        2: { textColor: MIST, cellWidth: 36 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 36 },
      },
      alternateRowStyles: { fillColor: CREAM },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 12;
  }

  // ── BON À SAVOIR ─────────────────────────────────────────────────────

  if (conseilsPratiques.length > 0) {
    y = guard(doc, y, 20);
    y = sectionBar(doc, y, "BON A SAVOIR - CONSEILS D'EXPERT");

    conseilsPratiques.forEach((conseil) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(conseil, CW - 14);
      const h = lines.length * 5.2 + 5;

      y = guard(doc, y, h);

      // Puce Gold
      doc.setFillColor(...GOLD);
      doc.circle(MARGIN + 3.5, y + 2.5, 1.8, "F");

      doc.setTextColor(...OCEAN);
      doc.text(lines, MARGIN + 8, y + 4);
      y += h;
    });

    y += 8;
  }

  // ── MENTIONS LÉGALES ─────────────────────────────────────────────────

  const atoutNum = profile?.atout_france_num   || null;
  const garantie = profile?.garantie_financiere || "APST";
  const rcpAssur = profile?.rcp_assurance       || "AXA France";

  const legal = [
    ...(atoutNum
      ? [`Immatriculation Atout France : ${atoutNum} - Garantie financiere ${garantie}.`]
      : []),
    `Assurance Responsabilite Civile Professionnelle souscrite aupres de ${rcpAssur}, conformement a l'article L.211-1 du Code du Tourisme.`,
    "Ce devis est soumis a nos Conditions Generales de Vente disponibles en agence ou sur simple demande.",
    "Droit de retractation : conformement a l'article L.221-28 du Code de la consommation, les forfaits touristiques sont exclus du droit de retractation.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  let legalH = 10;
  legal.forEach((l) => {
    legalH += doc.splitTextToSize(l, CW - 10).length * 4.5 + 1.5;
  });
  legalH += 6;

  y = guard(doc, y, legalH + 4);

  doc.setFillColor(243, 242, 240);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CW, legalH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...MIST);
  doc.text("MENTIONS LEGALES & INFORMATIONS REGLEMENTAIRES", MARGIN + 4, y + 6.5);

  let ly = y + 11;
  legal.forEach((line) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MIST);
    const ls = doc.splitTextToSize(line, CW - 10);
    doc.text(ls, MARGIN + 4, ly);
    ly += ls.length * 4.5 + 1.5;
  });

  // ── PIEDS DE PAGE (toutes les pages) ────────────────────────────────

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages, ref);
  }

  // ── SAUVEGARDE ───────────────────────────────────────────────────────

  doc.save(`Devis-Qovee-${ref}.pdf`);
}
