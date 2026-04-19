require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const Stripe    = require("stripe");

const app    = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "");

app.use(cors());

// ── Webhook Stripe — RAW BODY, doit être AVANT express.json() ─────────────
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET manquant dans .env");
    return res.status(500).json({ error: "Configuration webhook manquante" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Webhook] Signature invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Client Supabase admin (service role — accès complet, contourne le RLS)
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log(`[Stripe Webhook] Événement : ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId  = session.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from("profiles").update({
          stripe_customer_id  : session.customer,
          subscription_status : "active",
          subscription_id     : session.subscription,
        }).eq("id", userId);
        console.log(`[Stripe] Abonnement activé → user ${userId}`);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub    = event.data.object;
      const status = sub.status === "trialing" ? "trialing"
                   : sub.status === "active"   ? "active"
                   : sub.status;
      await supabaseAdmin.from("profiles")
        .update({ subscription_status: status })
        .eq("stripe_customer_id", sub.customer);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabaseAdmin.from("profiles")
        .update({ subscription_status: "canceled" })
        .eq("stripe_customer_id", sub.customer);
      console.log(`[Stripe] Abonnement annulé → customer ${sub.customer}`);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await supabaseAdmin.from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", invoice.customer);
      break;
    }
  }

  res.json({ received: true });
});

// Toutes les autres routes utilisent express.json()
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Extraction robuste du JSON depuis une réponse Claude ──────────────────
function extractJSON(text) {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Aucun objet JSON trouvé. Début reçu : "${cleaned.substring(0, 120)}"`);
  }
  const jsonStr = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (parseErr) {
    throw new Error(`JSON invalide : ${parseErr.message}\nContenu (300 premiers caractères) : ${jsonStr.substring(0, 300)}`);
  }
}

// ── Appel Claude avec prefill "{" + retry unique ──────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`\n[Claude] Tentative ${attempt}/${MAX_ATTEMPTS}`);
    console.log("[Claude] User prompt :\n", userPrompt, "\n");

    const response = await client.messages.create({
      model      : "claude-sonnet-4-6",
      max_tokens : 8000,
      system     : systemPrompt,
      messages   : [
        { role: "user",      content: userPrompt },
        { role: "assistant", content: "{"        },
      ],
    });

    const rawText = "{" + (response.content[0]?.text ?? "");
    console.log("=== RÉPONSE BRUTE CLAUDE ===\n", rawText.substring(0, 500), "\n=== FIN ===");

    try {
      return extractJSON(rawText);
    } catch (err) {
      console.error(`[Claude] Échec parsing tentative ${attempt} :`, err.message);
      if (attempt === MAX_ATTEMPTS) throw err;
      console.log("[Claude] Retry en cours…");
    }
  }
}

// ── POST /api/generate-quote ──────────────────────────────────────────────
app.post("/api/generate-quote", async (req, res) => {
  const formData = req.body || {};
  if (!formData.demandeClient) {
    return res.status(400).json({ error: "La demande client est obligatoire." });
  }
  try {
    const { generateDevisPrompt } = await import("./src/prompts/devisPrompt.js");
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
});

// ── POST /api/create-checkout-session ────────────────────────────────────
const PRICE_IDS = {
  solo   : process.env.STRIPE_PRICE_SOLO,
  pro    : process.env.STRIPE_PRICE_PRO,
  studio : process.env.STRIPE_PRICE_STUDIO,
};

app.post("/api/create-checkout-session", async (req, res) => {
  const { userId, userEmail, plan = "solo" } = req.body;
  if (!userId) return res.status(400).json({ error: "userId manquant" });

  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: `Plan inconnu : ${plan}` });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const session = await stripe.checkout.sessions.create({
      mode                 : "subscription",
      payment_method_types : ["card"],
      customer_email       : userEmail || undefined,
      line_items           : [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days : 7,
        metadata          : { user_id: userId },
      },
      metadata    : { user_id: userId },
      success_url : `${frontendUrl}/mes-devis?checkout=success`,
      cancel_url  : `${frontendUrl}/pricing`,
      locale      : "fr",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Erreur checkout session :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/customer-portal ──────────────────────────────────────────────
app.post("/api/customer-portal", async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: "customerId manquant" });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer   : customerId,
      return_url : `${frontendUrl}/mes-devis`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Erreur customer portal :", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅ Serveur Qovee démarré sur http://localhost:${PORT}`)
);

// Maintient le process en vie (Node v24 + Windows)
setInterval(() => {}, 1 << 30);
