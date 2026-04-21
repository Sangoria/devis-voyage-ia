import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const { customerId } = req.body;

  if (!customerId) return res.status(400).json({ error: "customerId manquant" });

  const frontendUrl = process.env.FRONTEND_URL || "https://qovee.com";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer  : customerId,
      return_url: `${frontendUrl}/mes-devis`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Erreur customer portal :", err.message);
    res.status(500).json({ error: err.message });
  }
}
