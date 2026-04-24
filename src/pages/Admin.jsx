import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchAdminStats } from "../lib/supabase";

const ADMIN_EMAIL = "clem.let10@gmail.com";

const RATING_LABELS = {
  parfait        : { label: "Parfait",        emoji: "😍", color: "#16A34A" },
  a_ameliorer    : { label: "À améliorer",    emoji: "🤔", color: "#D97706" },
  pas_utilisable : { label: "Pas utilisable", emoji: "😞", color: "#DC2626" },
};

function pct(n, total) {
  if (!total) return "0%";
  return Math.round((n / total) * 100) + "%";
}

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.email !== ADMIN_EMAIL) { navigate("/"); return; }
    fetchAdminStats().then((s) => { setStats(s); setFetching(false); });
  }, [user, loading, navigate]);

  if (loading || fetching) {
    return (
      <div className="app">
        <main className="main" style={{ paddingTop: "3rem", textAlign: "center", color: "var(--muted)" }}>
          Chargement…
        </main>
      </div>
    );
  }

  const { devisCount, usersCount, feedbacks } = stats;
  const total   = feedbacks.length;
  const parfait = feedbacks.filter((f) => f.rating === "parfait").length;
  const amelior = feedbacks.filter((f) => f.rating === "a_ameliorer").length;
  const inutile = feedbacks.filter((f) => f.rating === "pas_utilisable").length;

  return (
    <div className="app">
      <Nav />
      <main className="main" style={{ paddingTop: "3rem" }}>

        <div className="admin-header">
          <h1 className="admin-title">Dashboard Admin</h1>
          <span className="admin-badge">Bêta privée</span>
        </div>

        {/* KPIs */}
        <div className="admin-kpis">
          <div className="admin-kpi">
            <span className="admin-kpi-value">{devisCount}</span>
            <span className="admin-kpi-label">Devis générés</span>
          </div>
          <div className="admin-kpi">
            <span className="admin-kpi-value">{usersCount}</span>
            <span className="admin-kpi-label">Utilisateurs inscrits</span>
          </div>
          <div className="admin-kpi">
            <span className="admin-kpi-value">{total}</span>
            <span className="admin-kpi-label">Feedbacks reçus</span>
          </div>
        </div>

        {/* Satisfaction */}
        {total > 0 && (
          <div className="admin-card">
            <h2 className="admin-card-title">Satisfaction</h2>
            <div className="admin-satisfaction">
              {[
                { key: "parfait",        n: parfait, color: "#16A34A" },
                { key: "a_ameliorer",    n: amelior, color: "#D97706" },
                { key: "pas_utilisable", n: inutile, color: "#DC2626" },
              ].map(({ key, n, color }) => (
                <div key={key} className="admin-sat-row">
                  <span className="admin-sat-label">
                    {RATING_LABELS[key].emoji} {RATING_LABELS[key].label}
                  </span>
                  <div className="admin-sat-bar-wrap">
                    <div className="admin-sat-bar" style={{ width: pct(n, total), background: color }} />
                  </div>
                  <span className="admin-sat-pct">{pct(n, total)} ({n})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedbacks */}
        <div className="admin-card">
          <h2 className="admin-card-title">Derniers feedbacks</h2>
          {feedbacks.length === 0 ? (
            <p className="admin-empty">Aucun feedback pour le moment.</p>
          ) : (
            <div className="admin-fb-list">
              {feedbacks.map((fb) => {
                const r = RATING_LABELS[fb.rating] ?? { emoji: "?", label: fb.rating, color: "#888" };
                const date = new Date(fb.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={fb.id} className="admin-fb-item">
                    <div className="admin-fb-top">
                      <span className="admin-fb-rating" style={{ color: r.color }}>
                        {r.emoji} {r.label}
                      </span>
                      <span className="admin-fb-date">{date}</span>
                    </div>
                    {fb.comment && <p className="admin-fb-comment">"{fb.comment}"</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
