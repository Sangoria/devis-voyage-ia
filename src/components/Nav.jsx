import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function QoveeLogo() {
  return (
    <svg className="nav-logo" viewBox="0 0 30 30" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="#C4714A" strokeWidth="2.2"/>
      <circle cx="12" cy="12" r="4.5" fill="rgba(196,113,74,.15)"/>
      <path d="M18.5 18.5L26 26" stroke="#C4714A" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M12 9v6M9 12h6" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Nav() {
  const { user, profile, isSubscribed, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isHome     = location.pathname === "/";
  const isMesDevis = location.pathname === "/mes-devis";
  const isPricing  = location.pathname === "/pricing";

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <nav className="nav">
      <div className="nav-inner">

        {/* Logo */}
        <Link to="/" className="nav-brand" style={{ textDecoration: "none" }}>
          <QoveeLogo />
          <span className="nav-name">QOVEE</span>
        </Link>

        {/* Droite */}
        <div className="nav-right">
          {user ? (
            <>
              {/* Lien Mes devis */}
              <Link
                to="/mes-devis"
                className={`nav-link${isMesDevis ? " nav-link-active" : ""}`}
              >
                <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
                  <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Mes devis
              </Link>

              {/* Lien Tarifs (uniquement pour les non-abonnés) */}
              {!isSubscribed && (
                <Link
                  to="/pricing"
                  className={`nav-link nav-link-pricing${isPricing ? " nav-link-active" : ""}`}
                >
                  Passer Pro
                </Link>
              )}

              {/* Nom agence */}
              <span className="nav-agency">
                {profile?.agency_name || user.email?.split("@")[0]}
              </span>

              {/* Déconnexion */}
              <button className="nav-signout" onClick={handleSignOut}>
                <svg viewBox="0 0 18 18" fill="none" width="13" height="13">
                  <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 12l4-4-4-4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/pricing" className="nav-badge" style={{ textDecoration: "none" }}>
              Essai 14 jours
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
