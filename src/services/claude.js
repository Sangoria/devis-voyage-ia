export async function generateDevis(formData) {
  const response = await fetch("/api/generate-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    let message = "Erreur serveur";
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {}
    throw new Error(message);
  }

  const { devis } = await response.json();
  return devis;
}
