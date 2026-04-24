import { useState } from "react";
import { saveFeedback } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function DevisFeedback({ devisId }) {
  const { user } = useAuth();
  const [rating,  setRating]  = useState(null);
  const [comment, setComment] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!rating) return;
    setSending(true);
    await saveFeedback({ userId: user?.id ?? null, devisId: devisId ?? null, rating, comment });
    fetch("/api/notify-feedback", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ rating, comment, source: "devis" }),
    }).catch(() => {});
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="dv-fb-sent">
        <span className="dv-fb-sent-icon">✓</span>
        Merci pour votre retour !
      </div>
    );
  }

  return (
    <div className="dv-fb">
      <p className="dv-fb-question">Ce devis vous semble réaliste ?</p>
      <div className="dv-fb-ratings">
        {[
          { value: "parfait",        label: "Parfait",        emoji: "😍" },
          { value: "a_ameliorer",    label: "À améliorer",    emoji: "🤔" },
          { value: "pas_utilisable", label: "Pas utilisable", emoji: "😞" },
        ].map((r) => (
          <button key={r.value}
            className={`dv-fb-btn${rating === r.value ? " active" : ""}`}
            onClick={() => setRating(r.value)}>
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {rating && (
        <div className="dv-fb-extra">
          <textarea
            className="dv-fb-comment"
            placeholder="Qu'est-ce qu'on pourrait améliorer ? (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <button className="dv-fb-submit" onClick={handleSend} disabled={sending}>
            {sending ? "Envoi…" : "Envoyer →"}
          </button>
        </div>
      )}
    </div>
  );
}
