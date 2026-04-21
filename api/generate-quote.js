import Anthropic from "@anthropic-ai/sdk";
import { generateDevisPrompt } from "../src/prompts/devisPrompt.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJSON(text) {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Aucun objet JSON trouvé. Début reçu : "${cleaned.substring(0, 120)}"`);
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (parseErr) {
    throw new Error(`JSON invalide : ${parseErr.message}`);
  }
}

async function callClaude(systemPrompt, userPrompt) {
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await client.messages.create({
      model      : "claude-sonnet-4-6",
      max_tokens : 8000,
      system     : systemPrompt,
      messages   : [{ role: "user", content: userPrompt }],
    });
    const rawText = response.content[0]?.text ?? "";
    try {
      return extractJSON(rawText);
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // CORS
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const formData = req.body || {};
  if (!formData.demandeClient) {
    return res.status(400).json({ error: "La demande client est obligatoire." });
  }

  try {
    const { systemPrompt, userPrompt } = generateDevisPrompt(formData);
    const devis = await callClaude(systemPrompt, userPrompt);
    res.json({ devis });
  } catch (err) {
    console.error("Erreur generate-quote :", err.message);
    const isParsingError = err.message.includes("JSON") || err.message.includes("Aucun objet");
    res.status(500).json({
      error: isParsingError
        ? "La génération a échoué. Réessayez dans un instant."
        : (err.message || "Erreur lors de la génération du devis."),
    });
  }
}
