import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Nav from "../components/Nav";
import { useAuth } from "../contexts/AuthContext";

const FEATURES = [
  "Devis illimités",
  "Export PDF professionnel",
  "Historique complet des devis",
  "Support humain",
];

export default function Pricing() {
  const { user, profile, isSubscribed, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Succès après retour de Stripe Checkout
  const checkoutSuccess = new URLSearchParams(location.search).get("checkout") === "success";

  async function handleSubscribe() {
    if (!user) {
      navigate("/signup");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ userId: user.id, userEmail: user.email }),
      });
      const { url, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer-portal", {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ customerId: profile?.stripe_customer_id }),
      });
      const { url, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Impossible d'ouvrir le portail. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <Nav />

      <main className="pricing-main">

        {checkoutSuccess && (
          <div className="pricing-success-banner">
            ✓ Abonnement activé, bienvenue dans Qovee Pro&nbsp;!
          </div>
        )}

        <div className="pricing-header">
          <h1 className="pricing-title">Un tarif simple.</h1>
          <p className="pricing-sub">
            Pour les agents qui veulent travailler mieux, pas plus vite.
          </p>
        </div>

        <div className="pricing-card">

          <div className="pricing-plan-label">Pro</div>

          <div className="pricing-price-block">
            <span className="pricing-currency">€</span>
            <span className="pricing-amount">29</span>
            <span className="pricing-period">/mois</span>
          </div>

          <div className="pricing-trial-pill">7 jours d'essai gratuit</div>

          <ul className="pricing-features-list">
            {FEATURES.map((f) => (
              <li key={f} className="pricing-feature-item">
                <svg viewBox="0 0 16 16" fill="none" width="15" height="15">
                  <circle cx="8" cy="8" r="7" stroke="#B8965A" strokeWidth="1.5"/>
                  <path d="M5 8l2.5 2.5L11 5.5" stroke="#B8965A" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {error && <div className="pricing-error">{error}</div>}

          {isSubscribed ? (
            <div className="pricing-subscribed-block">
              <div className="pricing-active-badge">✓ Abonnement actif</div>
              <button
                className="pricing-portal-btn"
                onClick={handlePortal}
                disabled={loading}
              >
                {loading ? "Redirection…" : "Gérer mon abonnement →"}
              </button>
            </div>
          ) : (
            <button
              className="pricing-cta-btn"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <><span className="cta-spinner" />Redirection vers Stripe…</>
              ) : user ? (
                "Commencer l'essai gratuit, 7 jours →"
              ) : (
                "Créer un compte gratuit →"
              )}
            </button>
          )}

          {!user && (
            <p className="pricing-login-note">
              Déjà un compte ?{" "}
              <Link to="/login" className="pricing-login-link">Se connecter</Link>
            </p>
          )}

          <p className="pricing-guarantee">
            Annulation à tout moment · Sans engagement
          </p>
        </div>

        <p className="pricing-free-note">
          <strong>Essai sans carte</strong> · 3 devis gratuits pour tester Qovee avant de vous abonner.
        </p>

      </main>

      <footer className="footer">
        <span>Qovee © 2025</span>
        <span className="footer-dot">·</span>
        <span>29 €/mois</span>
      </footer>
    </div>
  );
}
