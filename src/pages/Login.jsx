import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

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

        {/* Logo */}
        <div className="auth-logo">
          <svg viewBox="0 0 30 30" fill="none" width="36" height="36">
            <circle cx="12" cy="12" r="8.5" stroke="#C4714A" strokeWidth="2.2"/>
            <circle cx="12" cy="12" r="4.5" fill="rgba(196,113,74,.15)"/>
            <path d="M18.5 18.5L26 26" stroke="#C4714A" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M12 9v6M9 12h6" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="auth-wordmark">QOVEE</span>
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
            <input
              id="password" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
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
