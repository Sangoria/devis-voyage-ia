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

const PAGE_BG = lighten(GOLD, 0.87);

// ── Constantes de mise en page ───────────────────────────────────────
const W      = 210;
const H      = 297;
const MARGIN = 18;
const CW     = W - MARGIN * 2;
const SAFE_Y = H - 26;
const FOOT_Y = H - 18;

// ── Helpers texte ────────────────────────────────────────────────────
function money(n) {
  return Number(n || 0).toLocaleString("fr-FR").replace(/ | /g, " ") + " €";
}

function parseFrDate(str) {
  if (!str) return null;
  if (str.includes("/")) {
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  }
  return new Date(str);
}

function longDate(str) {
  if (!str) return "";
  try {
    return parseFrDate(str).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return str; }
}

function shortDate(str) {
  if (!str) return "";
  try {
    return parseFrDate(str).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return str; }
}

/**
 * Nettoie le texte IA pour le PDF :
 * - Convertit les suites d'étoiles Unicode en notation "N*" (ex: ★★★★★ → 5*)
 * - Remplace les tirets cadratin/demi-cadratin par une virgule espace (jamais de — dans un devis pro)
 */
function sanitize(str) {
  if (!str) return "";
  return String(str)
    .replace(/★+|❤+/g, (m) => `${m.length}*`)   // ★★★★ → 4*
    .replace(/\s*[—–]\s*/g, ", ")                // — et – → ", "
    .trim();
}

// ── Helpers layout ───────────────────────────────────────────────────
function addPage(doc) {
  doc.addPage();
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, W, H, "F");
  return MARGIN;
}

function guard(doc, y, needed) {
  return y + needed > SAFE_Y ? addPage(doc) : y;
}

function sectionBar(doc, y, label, sublabel) {
  doc.setFillColor(...OCEAN);
  doc.rect(MARGIN, y, CW, sublabel ? 13 : 8.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text(label, MARGIN + 4, y + (sublabel ? 6 : 5.7));
  if (sublabel) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(...MIST);
    doc.text(sublabel, MARGIN + 4, y + 10.5);
  }
  return y + (sublabel ? 18 : 13);
}

function drawFooter(doc, pageNum, totalPages, ref) {
  doc.setFillColor(...OCEAN);
  doc.rect(0, FOOT_Y, W, H - FOOT_Y, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MIST);
  doc.text(`Ref. ${ref}`, MARGIN, FOOT_Y + 7);
  doc.text(`Page ${pageNum} / ${totalPages}`, W - MARGIN, FOOT_Y + 7, { align: "right" });
}

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

  // Fond doré clair page 1
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, W, H, "F");

  const ref   = `QOV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const today = longDate(new Date().toISOString().split("T")[0]);

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

  doc.setFillColor(...OCEAN);
  doc.rect(0, 0, W, 62, "F");
  doc.setFillColor(...TERRA);
  doc.rect(0, 59, W, 3, "F");

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(agencyName || "Mon Agence", nameX, 19);

  const contactParts = [contactName, phone, website].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MIST);
    doc.text(contactParts.join("  ·  "), nameX, 27);
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(60, 85, 100);
  doc.text("Propulse par Qovee", nameX, 34);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.setTextColor(...SAND);
  doc.text("Proposition de voyage", MARGIN, 43);

  const titreShort = titre.length > 58 ? titre.substring(0, 58) + "..." : titre;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...TERRA);
  doc.text(sanitize(titreShort), MARGIN, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MIST);
  doc.text(`Ref. ${ref}`, W - MARGIN, 18, { align: "right" });
  doc.text(`Emis le ${today}`, W - MARGIN, 24.5, { align: "right" });

  doc.setFillColor(...TERRA);
  doc.roundedRect(W - MARGIN - 38, 44.5, 38, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text("Valable 30 jours", W - MARGIN - 19, 50.2, { align: "center" });

  let y = 72;

  // ── BLOC RÉCAPITULATIF (compact) ────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const resumeAllLines = resume ? doc.splitTextToSize(sanitize(resume), CW - 20) : [];
  const resumeLines = resumeAllLines.slice(0, 2); // max 2 lignes pour tenir sur page 1

  const metaItems = [
    destination && `Destination : ${destination}`,
    duree       && `Duree       : ${duree}`,
    voyageurs   && `Voyageurs   : ${typeGroupe ? typeGroupe + "  -  " : ""}${voyageurs} pers.`,
    dateDebut   && `Depart      : ${shortDate(dateDebut)}`,
    dateFin     && `Retour      : ${shortDate(dateFin)}`,
  ].filter(Boolean);

  const expLine = typesExperience.length > 0 ? typesExperience.join("  ·  ") : "";

  const boxH = 6
    + (metaItems.length > 0 ? Math.ceil(metaItems.length / 2) * 5.5 + 3 : 0)
    + (expLine ? 6 : 0)
    + (resumeLines.length > 0 ? resumeLines.length * 4.5 + 2 : 0)
    + 4;

  doc.setFillColor(...CREAM);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, "FD");

  doc.setFillColor(...TERRA);
  doc.roundedRect(MARGIN, y, 3.5, boxH, 1.5, 1.5, "F");

  const bx = MARGIN + 10;
  let by = y + 7;

  if (metaItems.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...OCEAN);
    metaItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      doc.text(item, bx + col * (CW / 2 - 5), by + row * 5.5);
    });
    by += Math.ceil(metaItems.length / 2) * 5.5 + 3;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(bx, by, W - MARGIN - 4, by);
    by += 4;
  }

  if (expLine) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...MIST);
    doc.text("Experience : " + expLine, bx, by);
    by += 7;
  }

  if (resumeLines.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...OCEAN);
    doc.text(resumeLines, bx, by);
  }

  y += boxH + 6;

  // ── TABLEAU DES PRIX (PAGE 1) ────────────────────────────────────────
  const tableRows = [];

  const addRow = (poste, detail, qtyLabel, total) => {
    tableRows.push([
      poste,
      sanitize(detail) || "",
      qtyLabel || "",
      money(total || 0),
    ]);
  };

  if (couts.vols) {
    const v = couts.vols;
    const qty = v.quantite && v.prix_unitaire ? `${v.quantite} x ${money(v.prix_unitaire)}` : "";
    addRow("Vols aller-retour", v.detail, qty, v.total ?? v.montant);
  }
  if (couts.hebergement) {
    const h = couts.hebergement;
    const qty = h.quantite && h.prix_unitaire ? `${h.quantite} nuits x ${money(h.prix_unitaire)}` : "";
    addRow("Hebergement", h.detail, qty, h.total ?? h.montant);
  }
  if (Array.isArray(couts.excursions) && couts.excursions.length > 0) {
    const totalExc = couts.excursions.reduce((s, e) => s + Number(e.prix || 0), 0);
    const detail   = couts.excursions.map((e) => {
      const nom = sanitize(e.nom || "");
      return (nom.length > 48 ? nom.substring(0, 48) + "..." : nom);
    }).join("\n");
    addRow("Excursions & activites", detail, "", totalExc);
  } else if (couts.excursions) {
    const e = couts.excursions;
    addRow("Excursions & activites", e.detail, "", e.total ?? e.montant);
  }
  if (couts.transferts) {
    const t = couts.transferts;
    addRow("Transferts", t.detail, "", t.total ?? t.montant);
  }
  if (couts.location) {
    const l = couts.location;
    addRow("Location de vehicule", l.detail, "", l.total ?? l.montant);
  }
  if (couts.assurance) {
    const a = couts.assurance;
    addRow("Assurance voyage", a.detail, "", a.total ?? a.montant);
  }
  if (couts.divers) {
    const d = couts.divers;
    addRow("Divers", d.detail, "", d.total ?? d.montant);
  }

  if (tableRows.length > 0) {
    y = sectionBar(doc, y, "DETAIL DES COUTS");

    autoTable(doc, {
      startY: y,
      head: [["Poste", "Detail", "Qte x P.U.", "Montant"]],
      body: tableRows,
      foot: [[
        { content: "TOTAL TTC", styles: { fontStyle: "bold", textColor: OCEAN, fontSize: 10 } },
        {
          content: budgetMode === "personne" ? "Prix par personne" : "Prix total groupe",
          styles: { textColor: MIST, fontStyle: "italic" },
          colSpan: 2,
        },
        { content: money(totalFinal), styles: { fontStyle: "bold", textColor: TERRA, fontSize: 12 } },
      ]],
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
        textColor: OCEAN,
        lineColor: BORDER,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: OCEAN,
        textColor: GOLD,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      footStyles: {
        fillColor: TERRA_L,
        lineWidth: 0,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 46 },
        1: { textColor: MIST },
        2: { textColor: MIST, cellWidth: 34 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 34 },
      },
      alternateRowStyles: { fillColor: CREAM },
      margin: { left: MARGIN, right: MARGIN, bottom: 20 },
      didAddPage: () => {
        doc.setFillColor(...PAGE_BG);
        doc.rect(0, 0, W, H, "F");
      },
    });
  }

  // ── PROGRAMME — TOUJOURS PAGE 2 ──────────────────────────────────────
  doc.addPage();
  y = MARGIN;

  if (itineraire.length > 0) {
    // Titre de section stylisé
    y = sectionBar(
      doc, y,
      "PROGRAMME DETAILLE",
      "Itineraire jour par jour"
    );

    itineraire.forEach((jour, i) => {
      const rawActivites = Array.isArray(jour.activites)
        ? jour.activites.map((a) => ({ label: null, text: sanitize(a) }))
        : [
            jour.matin     && { label: "MATIN",      text: sanitize(jour.matin) },
            jour.apresmidi && { label: "APRES-MIDI", text: sanitize(jour.apresmidi) },
            jour.soir      && { label: "SOIR",       text: sanitize(jour.soir) },
          ].filter(Boolean);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let estH = 12;
      rawActivites.forEach((s) => {
        estH += doc.splitTextToSize(s.text, CW - 36).length * 5 + 5;
      });
      if (jour.hebergement) estH += 6;
      if (jour.repas) estH += 6;

      y = guard(doc, y, estH);

      // Ligne du jour
      doc.setFillColor(236, 242, 246);
      doc.rect(MARGIN, y, CW, 9, "F");

      doc.setFillColor(...GOLD);
      doc.rect(MARGIN + 4.5, y + 1.5, 2, 6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...TERRA);
      doc.text(`JOUR ${jour.jour}`, MARGIN + 11.5, y + 5.8);

      // Date — taille +10% par rapport à l'original (7 → 7.7)
      const ds = shortDate(jour.date);
      if (ds) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.7);
        doc.setTextColor(...MIST);
        doc.text(ds, MARGIN + 32, y + 5.8);
      }

      if (jour.titre) {
        const tx = ds ? MARGIN + 54 : MARGIN + 32;
        const titleW = W - MARGIN - tx;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...OCEAN);
        const t = sanitize(jour.titre);
        const titleLine = doc.splitTextToSize(t, titleW)[0];
        doc.text(titleLine, tx, y + 5.8);
      }

      y += 11;

      // Hébergement — nom de l'hôtel (propre, sans étoiles Unicode)
      if (jour.hebergement) {
        y = guard(doc, y, 6);
        const hotelClean = sanitize(jour.hebergement);
        const hotelShort = hotelClean.length > 80 ? hotelClean.substring(0, 80) + "..." : hotelClean;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...GOLD);
        doc.text(hotelShort, MARGIN + 8, y + 3.5);
        y += 5.5;
      }

      // Repas — formule
      if (jour.repas) {
        y = guard(doc, y, 5.5);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(...MIST);
        doc.text(sanitize(jour.repas), MARGIN + 8, y + 3.5);
        y += 5.5;
      }

      // Activités
      rawActivites.forEach((slot) => {
        const textX = slot.label ? MARGIN + 26 : MARGIN + 8;
        const textW = slot.label ? CW - 36 : CW - 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const lines  = doc.splitTextToSize(slot.text, textW);
        const slotH  = lines.length * 5 + 4;

        y = guard(doc, y, slotH);

        if (slot.label) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(...TERRA);
          doc.text(slot.label, MARGIN + 4, y + 4);
        } else {
          doc.setDrawColor(...GOLD);
          doc.setLineWidth(0.9);
          doc.line(MARGIN + 2.5, y + 3, MARGIN + 6.5, y + 3);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...OCEAN);
        doc.text(lines, textX, y + 4);

        y += slotH;
      });

      if (i < itineraire.length - 1) {
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, y + 2, W - MARGIN, y + 2);
        y += 6;
      }
    });

    y += 10;
  }

  // ── BON À SAVOIR ─────────────────────────────────────────────────────
  if (conseilsPratiques.length > 0) {
    y = guard(doc, y, 20);
    y = sectionBar(doc, y, "BON A SAVOIR", "Conseils d'expert");

    conseilsPratiques.forEach((conseil) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(sanitize(conseil), CW - 14);
      const h = lines.length * 5.2 + 5;

      y = guard(doc, y, h);

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
  legal.forEach((l) => { legalH += doc.splitTextToSize(l, CW - 10).length * 4.5 + 1.5; });
  legalH += 6;

  // Toujours en bas de la dernière page, juste au-dessus du footer
  const legalPinY = FOOT_Y - legalH - 3;
  if (y > legalPinY) {
    addPage(doc);
  }
  y = legalPinY;

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

  // ── PIEDS DE PAGE ────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages, ref);
  }

  doc.save(`Devis-Qovee-${ref}.pdf`);
}
