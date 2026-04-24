import nodemailer from "nodemailer";

const RATING_LABELS = {
  parfait        : "😍 Parfait",
  a_ameliorer    : "🤔 À améliorer",
  pas_utilisable : "😞 Pas utilisable",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { rating, comment, source } = req.body ?? {};
  if (!rating) return res.status(400).json({ error: "rating manquant" });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "contact.qovee@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const label  = RATING_LABELS[rating] ?? rating;
  const origin = source === "banner" ? "Bouton bannière bêta" : "Post-génération de devis";

  try {
    await transporter.sendMail({
      from   : '"Qovee Feedback" <contact.qovee@gmail.com>',
      to     : "contact.qovee@gmail.com",
      subject: `[Feedback Qovee] ${label}`,
      text   : [
        `Nouveau feedback reçu sur Qovee`,
        ``,
        `Note     : ${label}`,
        `Source   : ${origin}`,
        `Commentaire : ${comment || "(aucun)"}`,
      ].join("\n"),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[notify-feedback]", err.message);
    res.status(500).json({ error: err.message });
  }
}
