import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.message?.includes("Invalid login")
          ? "Email ou mot de passe incorrect."
          : err.message || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Retour accueil */}
        <Link to="/" className="auth-back">← Accueil</Link>

        {/* Logo */}
        <div className="auth-logo">
          <span style={{
            fontFamily    : "var(--font-sans)",
            fontSize      : "3.63rem",
            fontWeight    : 700,
            color         : "var(--sand)",
            letterSpacing : "-0.02em",
            lineHeight    : 1,
          }}>
            <span style={{ position: "relative", color: "var(--terra)" }}>
              Q
              <span style={{
                position     : "absolute",
                width        : "0.099em",
                height       : "0.099em",
                background   : "var(--gold)",
                borderRadius : "50%",
                bottom       : "0.24em",
                right        : "0.400em",
              }} />
            </span>
            <span style={{ color: "var(--ocean)" }}>ovee</span>
          </span>
        </div>

        <h1 className="auth-title">Connexion</h1>
        <p className="auth-sub">Bienvenue. Connectez-vous à votre espace agent.</p>

        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
                id="password" type={showPw ? "text" : "password"} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? "Masquer" : "Afficher"}>
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <><span className="cta-spinner"/>Connexion…</> : "Se connecter →"}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="auth-switch-link">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
