import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

const PLANS = [
  {
    id      : "solo",
    name    : "Solo",
    price   : 29,
    desc    : "Pour les agents indépendants",
    features: [
      { text: "1 utilisateur",           included: true  },
      { text: "20 devis premium/mois",   included: true  },
      { text: "Export PDF pro",          included: true  },
      { text: "Historique des devis",    included: true  },
      { text: "Branding agence sur PDF", included: false },
      { text: "Multi-utilisateurs",               included: false },
      { text: "Tableau de bord & suivi clients",  included: false },
      { text: "Support limité",                   included: true  },
    ],
  },
  {
    id      : "pro",
    name    : "Pro",
    price   : 59,
    desc    : "Pour les petites agences",
    popular : true,
    features: [
      { text: "3 utilisateurs",          included: true  },
      { text: "Devis illimités",         included: true  },
      { text: "Export PDF pro",          included: true  },
      { text: "Historique des devis",    included: true  },
      { text: "Branding agence sur PDF", included: true  },
      { text: "Multi-utilisateurs",               included: false },
      { text: "Tableau de bord & suivi clients",  included: false },
      { text: "Support prioritaire",              included: true  },
    ],
  },
  {
    id      : "studio",
    name    : "Studio",
    price   : 99,
    desc    : "Pour les agences établies",
    features: [
      { text: "5+ utilisateurs",              included: true },
      { text: "Devis illimités",              included: true },
      { text: "Export PDF pro",               included: true },
      { text: "Historique des devis",         included: true },
      { text: "Branding agence sur PDF",      included: true },
      { text: "Multi-utilisateurs",               included: true },
      { text: "Tableau de bord & suivi clients",  included: true },
      { text: "Support prioritaire dédié",        included: true },
    ],
  },
];

export default function Pricing() {
  const { user, profile, isSubscribed, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const checkoutSuccess = new URLSearchParams(location.search).get("checkout") === "success";

  async function handleSubscribe(planId) {
    if (!user) {
      navigate("/signup");
      return;
    }
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ userId: user.id, userEmail: user.email, plan: planId }),
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
    setLoading("portal");
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

      <main className="pricing-main">

        {checkoutSuccess && (
          <div className="pricing-success-banner">
            ✓ Abonnement activé, bienvenue dans Qovee&nbsp;!
          </div>
        )}

        <div className="pricing-header">
          <h1 className="pricing-title">Choisissez votre formule.</h1>
          <p className="pricing-sub">
            7 jours d'essai gratuit · Annulation à tout moment
          </p>
        </div>

        <div className="pricing-cards-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card${plan.popular ? " pricing-card--popular" : ""}`}
            >
              {plan.popular && (
                <div className="pricing-popular-badge">Le plus choisi</div>
              )}

              <div className="pricing-plan-label">{plan.name}</div>
              <p className="pricing-plan-desc">{plan.desc}</p>

              <div className="pricing-price-block">
                <span className="pricing-currency">€</span>
                <span className="pricing-amount">{plan.price}</span>
                <span className="pricing-period">/mois</span>
              </div>

              <div className="pricing-trial-pill">7 jours d'essai gratuit</div>

              <ul className="pricing-features-list">
                {plan.features.map((f) => (
                  <li key={f.text} className={`pricing-feature-item${f.included ? "" : " pricing-feature-item--off"}`}>
                    {f.included ? (
                      <svg viewBox="0 0 16 16" fill="none" width="15" height="15" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" stroke="#B8965A" strokeWidth="1.5"/>
                        <path d="M5 8l2.5 2.5L11 5.5" stroke="#B8965A" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none" width="15" height="15" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" opacity="0.4"/>
                      </svg>
                    )}
                    {f.text}
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
                    disabled={!!loading}
                  >
                    {loading === "portal" ? "Redirection…" : "Gérer mon abonnement →"}
                  </button>
                </div>
              ) : (
                <button
                  className="pricing-cta-btn"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!loading}
                >
                  {loading === plan.id ? (
                    <><span className="cta-spinner" />Redirection vers Stripe…</>
                  ) : user ? (
                    "Commencer l'essai gratuit →"
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
            </div>
          ))}
        </div>

        <p className="pricing-guarantee" style={{ textAlign: "center", marginTop: "2rem" }}>
          Sans engagement · Annulation à tout moment
        </p>

        <p className="pricing-free-note">
          <strong>Essai sans carte</strong> · 3 devis gratuits pour tester Qovee avant de vous abonner.
        </p>

      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <span className="site-footer-name">
              <span className="site-footer-name-q">Q</span>ovee
            </span>
          </div>
          <div className="site-footer-links">
            {[
              { to: "/mentions-legales", label: "Mentions légales" },
              { to: "/confidentialite",  label: "Confidentialité" },
              { to: "/cookies",          label: "Cookies" },
              { to: "/cgu",              label: "CGU" },
              { to: "/cgv",              label: "CGV" },
            ].map(({ to, label }, i, arr) => (
              <span key={to} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Link to={to} className="site-footer-link">{label}</Link>
                {i < arr.length - 1 && <span style={{ color: "#8A9BA8" }}>·</span>}
              </span>
            ))}
          </div>
          <p className="site-footer-baseline">
            <span style={{ color: "#fff" }}>Décris le voyage. </span>
            <span style={{ color: "var(--terra)" }}>Qovee rédige le devis.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
