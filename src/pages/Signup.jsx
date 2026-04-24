import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { signUp }  = useAuth();
  const navigate    = useNavigate();

  const [agencyName,  setAgencyName]  = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      return setError("Le mot de passe doit contenir au moins 6 caractères.");
    }
    if (password !== confirm) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    setLoading(true);
    try {
      await signUp(email, password, agencyName);
      // Supabase envoie un email de confirmation par défaut.
      // Si tu désactives la confirmation dans le dashboard, l'user est connecté directement.
      setDone(true);
    } catch (err) {
      setError(
        err.message?.includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : err.message || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  // État après inscription : email de confirmation envoyé
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-done">
          <div className="auth-done-icon">✓</div>
          <h2 className="auth-title">Compte créé !</h2>
          <p className="auth-sub" style={{ textAlign: "center" }}>
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
            <br/>Cliquez sur le lien pour activer votre compte.
          </p>
          <Link to="/login" className="auth-btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "1.5rem" }}>
            Aller à la connexion →
          </Link>
          <p style={{ fontSize: "0.78rem", color: "#8A9BA8", textAlign: "center", marginTop: "0.75rem" }}>
            Astuce : si vous ne voyez pas l'email, vérifiez vos spams.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Retour accueil */}
        <Link to="/" className="auth-back">← Accueil</Link>

        {/* Logo */}
        <div className="auth-logo">
          <img src="/favicon.png" width="72" height="72" alt="Qovee" />
          <span className="auth-wordmark">QOVEE</span>
        </div>

        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-sub">7 jours d'essai gratuit, sans carte bancaire.</p>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="agencyName">Nom de l'agence</label>
            <input
              id="agencyName" type="text" autoComplete="organization"
              value={agencyName} onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Voyages Dupont" required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@agence.fr" required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="auth-pw-wrap">
              <input
                id="password" type={showPw ? "text" : "password"} autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères" required minLength={6}
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? "Masquer" : "Afficher"}>
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <div className="auth-pw-wrap">
              <input
                id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" required
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? "Masquer" : "Afficher"}>
                {showConfirm
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <><span className="cta-spinner"/>Création…</> : "Créer mon compte →"}
          </button>
        </form>

        <p className="auth-switch">
          Déjà un compte ?{" "}
          <Link to="/login" className="auth-switch-link">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
