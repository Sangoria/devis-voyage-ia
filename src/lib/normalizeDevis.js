function resolveTotal(obj) {
  return Number(obj?.total ?? obj?.montant ?? obj?.prix ?? 0);
}

function buildLignes(raw) {
  if (raw.lignes_editees) return raw.lignes_editees;

  const couts = raw.couts ?? {};
  const lignes = [];

  if (couts.vols) {
    lignes.push({
      id: "vols",
      label: "Vols A/R",
      detail: couts.vols.detail ?? null,
      prixUnitaire: couts.vols.prix_unitaire ?? null,
      quantite: couts.vols.quantite ?? null,
      unite: "pers.",
      montant: resolveTotal(couts.vols),
    });
  }

  if (couts.hebergement) {
    lignes.push({
      id: "hebergement",
      label: "Hébergement",
      detail: couts.hebergement.detail ?? null,
      prixUnitaire: couts.hebergement.prix_unitaire ?? null,
      quantite: couts.hebergement.quantite ?? null,
      unite: "nuits",
      montant: resolveTotal(couts.hebergement),
    });
  }

  if (Array.isArray(couts.excursions)) {
    couts.excursions.forEach((exc, i) => {
      lignes.push({
        id: `exc_${i}`,
        label: exc.nom ?? "Excursion",
        detail: null,
        prixUnitaire: null,
        quantite: null,
        unite: null,
        montant: Number(exc.prix ?? 0),
      });
    });
  } else if (couts.excursions) {
    lignes.push({
      id: "excursions",
      label: "Excursions & activités",
      detail: couts.excursions.detail ?? null,
      prixUnitaire: null,
      quantite: null,
      unite: null,
      montant: resolveTotal(couts.excursions),
    });
  }

  if (couts.transferts) {
    lignes.push({
      id: "transferts",
      label: "Transferts",
      detail: couts.transferts.detail ?? null,
      prixUnitaire: null,
      quantite: null,
      unite: null,
      montant: resolveTotal(couts.transferts),
    });
  }

  if (couts.assurance) {
    lignes.push({
      id: "assurance",
      label: "Assurance voyage",
      detail: couts.assurance.detail ?? null,
      prixUnitaire: null,
      quantite: null,
      unite: null,
      montant: resolveTotal(couts.assurance),
    });
  }

  if (couts.divers) {
    lignes.push({
      id: "divers",
      label: "Divers",
      detail: couts.divers.detail ?? null,
      prixUnitaire: null,
      quantite: null,
      unite: null,
      montant: resolveTotal(couts.divers),
    });
  }

  return lignes;
}

/**
 * Convertit n'importe quelle réponse IA en format canonique garanti.
 * Préserve les détails (prix unitaire, quantité, texte descriptif).
 * Ne modifie pas les données stockées en base — uniquement pour l'affichage.
 */
export function normalizeDevis(raw) {
  if (!raw) return null;

  const itineraire = (raw.itineraire ?? []).map((j, i) => ({
    jour: j.jour ?? i + 1,
    date: j.date ?? null,
    titre: j.titre ?? "",
    activites: Array.isArray(j.activites)
      ? j.activites
      : [j.matin, j.apresmidi, j.soir].filter(Boolean),
    hebergement: j.hebergement ?? null,
    repas: j.repas ?? null,
  }));

  return {
    titre: raw.titre ?? "",
    resume: raw.resume ?? "",
    itineraire,
    lignes: buildLignes(raw),
    total_ttc: Number(raw.total_ttc ?? raw.totalTTC ?? 0),
    conseilsPratiques: raw.conseilsPratiques ?? [],
    avertissements: raw.avertissements ?? [],
  };
}
