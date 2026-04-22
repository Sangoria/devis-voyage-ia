import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Désactive le body parser Vercel pour lire le body brut (requis par Stripe)
export const config = {
  api: { bodyParser: false },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end",  ()      => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const sig    = req.headers["stripe-signature"];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET manquant");
    return res.status(500).json({ error: "Configuration webhook manquante" });
  }

  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Webhook] Signature invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId  = session.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from("profiles").update({
          stripe_customer_id  : session.customer,
          subscription_status : "active",
          subscription_id     : session.subscription,
          subscription_plan   : session.metadata?.plan ?? "solo",
        }).eq("id", userId);
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
}
