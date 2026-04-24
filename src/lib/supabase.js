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

function frDateToIso(str) {
  if (!str) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m}-${d}`;
  }
  return str;
}

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
    start_date         : frDateToIso(formData.dateDebut) || null,
    end_date           : frDateToIso(formData.dateFin)   || null,
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

/** Met à jour le contenu édité d'un devis. */
export async function updateDevisContent(id, devisJson) {
  return supabase
    .from("devis")
    .update({
      generated_content : devisJson,
      total_price       : devisJson.total_ttc ?? null,
      title             : devisJson.titre ?? "",
    })
    .eq("id", id)
    .select()
    .single();
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

/** Upload un avatar et retourne son URL publique. */
export async function uploadAvatar(userId, file) {
  const ext  = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) { console.error("Avatar upload error:", upErr); return { url: null, error: upErr }; }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);

  return { url, error: dbErr ?? null };
}

/** Upload le logo agence et retourne son URL publique. */
export async function uploadLogo(userId, file) {
  const ext  = file.name.split(".").pop();
  const path = `${userId}/logo.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { url: null, error: upErr };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ logo_url: url })
    .eq("id", userId);

  return { url, error: dbErr ?? null };
}

/** Compte le nombre de devis d'un utilisateur (pour le quota gratuit). */
export async function countDevis(userId) {
  const { count, error } = await supabase
    .from("devis")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return { count: count ?? 0, error };
}

/** Sauvegarde un feedback bêta. */
export async function saveFeedback({ userId, devisId, rating, comment }) {
  return supabase.from("feedback").insert({
    user_id   : userId  ?? null,
    devis_id  : devisId ?? null,
    rating,
    comment   : comment || null,
  });
}

/** Charge les stats admin : total devis, total users, derniers feedbacks. */
export async function fetchAdminStats() {
  const [devisRes, usersRes, feedbackRes] = await Promise.all([
    supabase.from("devis").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("feedback")
      .select("id, rating, comment, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return {
    devisCount : devisRes.count  ?? 0,
    usersCount : usersRes.count  ?? 0,
    feedbacks  : feedbackRes.data ?? [],
  };
}
