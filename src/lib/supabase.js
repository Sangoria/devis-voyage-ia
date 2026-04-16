import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️  Variables Supabase manquantes dans .env.local\n" +
    "   VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis."
  );
}

export const supabase = createClient(
  supabaseUrl  || "",
  supabaseKey  || ""
);

// ── Helpers devis ────────────────────────────────────────────────────────────

/** Sauvegarde un devis généré par Claude en base. Retourne { data, error }. */
export async function saveDevis({ userId, formData, devisJson }) {
  const row = {
    user_id            : userId,
    title              : devisJson.titre            ?? "",
    destination        : formData.destination       ?? "",
    travelers          : Number(formData.voyageurs) || null,
    group_type         : formData.typeGroupe?.toLowerCase() || null,
    budget             : Number(formData.budget)    || null,
    budget_type        : formData.budgetMode === "personne" ? "par_personne" : "total",
    start_date         : formData.dateDebut         || null,
    end_date           : formData.dateFin           || null,
    dates_flexibles    : formData.datesFlexibles    ?? false,
    experience_type    : formData.typesExperience?.length ? formData.typesExperience : null,
    client_description : formData.demandeClient     ?? "",
    contraintes        : formData.contraintes       || null,
    generated_content  : devisJson,
    total_price        : devisJson.total_ttc ?? devisJson.totalTTC ?? null,
    status             : "brouillon",
  };

  return supabase.from("devis").insert(row).select().single();
}

/** Met à jour le statut d'un devis. */
export async function updateDevisStatus(id, status) {
  const patch = { status };
  if (status === "envoye") patch.sent_at = new Date().toISOString();
  return supabase.from("devis").update(patch).eq("id", id).select().single();
}

/** Charge tous les devis d'un utilisateur, du plus récent au plus ancien. */
export async function fetchDevis(userId) {
  return supabase
    .from("devis")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

/** Compte le nombre de devis d'un utilisateur (pour le quota gratuit). */
export async function countDevis(userId) {
  const { count, error } = await supabase
    .from("devis")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return { count: count ?? 0, error };
}
