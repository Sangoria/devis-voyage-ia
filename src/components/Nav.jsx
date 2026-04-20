import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function UserAvatar({ name, avatarUrl }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="nav-avatar nav-avatar--img" />;
  }
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";
  return <span className="nav-avatar">{initials}</span>;
}

export default function Nav() {
  const { user, profile, isSubscribed, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const isCreer     = location.pathname === "/creer";
  const isMesDevis  = location.pathname === "/mes-devis";
  const isMonCompte = location.pathname === "/mon-compte";
  const isPricing   = location.pathname === "/pricing";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const displayName = profile?.agency_name || user?.email?.split("@")[0] || "";

  return (
    <nav className={`nav${scrolled ? " nav-scrolled" : ""}`}>
      <div className="nav-inner">

        {/* GAUCHE */}
        <div className="nav-left">
          {user && (
            <>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="nav-home-icon" title="Accueil">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M3 9.5L12 2l9 7.5V20a1.5 1.5 0 01-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 013 20V9.5z"
                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                to="/creer"
                className={`nav-link${isCreer ? " nav-link-active" : ""}`}
              >
                Créer un devis
              </Link>
              <Link
                to="/mes-devis"
                className={`nav-link${isMesDevis ? " nav-link-active" : ""}`}
              >
                Mes devis
              </Link>
              <Link
                to="/mon-compte"
                className={`nav-link${isMonCompte ? " nav-link-active" : ""}`}
              >
                Mon compte
              </Link>
            </>
          )}
        </div>

        {/* CENTRE */}
        <Link to="/" className="nav-brand">
          <span className="nav-name">
            <span className="nav-name-q">Q</span>ovee
          </span>
        </Link>

        {/* DROITE */}
        <div className="nav-right">
          {user ? (
            <>
              {!isSubscribed && (
                <Link
                  to="/pricing"
                  className={`nav-btn-pro${isPricing ? " nav-btn-pro-active" : ""}`}
                >
                  Passer Pro
                </Link>
              )}
              <Link to="/mon-compte" className="nav-user" style={{ textDecoration: "none" }}>
                <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} />
                <span className="nav-agency">{displayName}</span>
              </Link>
              <button className="nav-signout" onClick={handleSignOut} title="Déconnexion">
                <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
                  <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 12l4-4-4-4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="nav-link">Se connecter</Link>
              <Link to="/signup" className="nav-btn-pro">S'inscrire</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
