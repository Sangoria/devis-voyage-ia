import Stripe from "stripe";

const PRICE_IDS = {
  solo  : process.env.STRIPE_PRICE_SOLO,
  pro   : process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const { userId, userEmail, plan = "solo" } = req.body;

  if (!userId) return res.status(400).json({ error: "userId manquant" });

  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: `Plan inconnu : ${plan}` });

  const frontendUrl = process.env.FRONTEND_URL || "https://qovee.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode                 : "subscription",
      payment_method_types : ["card"],
      customer_email       : userEmail || undefined,
      line_items           : [{ price: priceId, quantity: 1 }],
      subscription_data    : {
        trial_period_days: 7,
        metadata         : { user_id: userId },
      },
      metadata    : { user_id: userId, plan },
      success_url : `${frontendUrl}/mes-devis?checkout=success`,
      cancel_url  : `${frontendUrl}/pricing`,
      locale      : "fr",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Erreur checkout session :", err.message);
    res.status(500).json({ error: err.message });
  }
}
