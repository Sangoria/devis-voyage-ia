import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { saveFeedback } from "../lib/supabase";

export default function BetaBanner() {
  const { user } = useAuth();
  const bannerRef = useRef(null);
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      if (bannerRef.current) {
        document.documentElement.style.setProperty(
          "--beta-h",
          `${bannerRef.current.offsetHeight}px`
        );
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (bannerRef.current) ro.observe(bannerRef.current);
    return () => ro.disconnect();
  }, []);
  const [rating,  setRating]  = useState(null);
  const [comment, setComment] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!rating) return;
    setSending(true);
    await saveFeedback({ userId: user?.id ?? null, devisId: null, rating, comment });
    fetch("/api/notify-feedback", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ rating, comment, source: "banner" }),
    }).catch(() => {});
    setSending(false);
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setRating(null); setComment(""); }, 1800);
  }

  return (
    <>
      <div className="beta-banner" ref={bannerRef}>
        <span className="beta-badge">BÊTA</span>
        <span className="beta-text">Version bêta — Vos retours comptent !</span>
        <button className="beta-feedback-btn" onClick={() => setOpen(true)}>
          Donner mon avis
        </button>
      </div>

      {open && (
        <div className="fb-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="fb-modal">
            <button className="fb-close" onClick={() => setOpen(false)}>×</button>

            {sent ? (
              <div className="fb-sent">
                <div className="fb-sent-icon">✓</div>
                <p>Merci pour votre retour !</p>
              </div>
            ) : (
              <>
                <h3 className="fb-title">Votre avis sur Qovee</h3>
                <p className="fb-sub">En 10 secondes, aidez-nous à améliorer l'outil.</p>

                <div className="fb-ratings">
                  {[
                    { value: "parfait",       label: "Parfait",       emoji: "😍" },
                    { value: "a_ameliorer",   label: "À améliorer",   emoji: "🤔" },
                    { value: "pas_utilisable",label: "Pas utilisable", emoji: "😞" },
                  ].map((r) => (
                    <button key={r.value}
                      className={`fb-rating-btn${rating === r.value ? " active" : ""}`}
                      onClick={() => setRating(r.value)}>
                      <span className="fb-emoji">{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  className="fb-comment"
                  placeholder="Qu'est-ce qu'on pourrait améliorer ? (optionnel)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />

                <button className="fb-submit" onClick={handleSend} disabled={!rating || sending}>
                  {sending ? "Envoi…" : "Envoyer mon avis →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
