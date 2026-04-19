import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Nav from "../components/Nav";
import { useAuth } from "../contexts/AuthContext";
import "../App.css";

const FEATURES = ["Devis professionnel PDF", "Prêt à envoyer au client", "Généré en 2 minutes"];

const FAQ_ITEMS = [
  {
    q: "Quelle différence avec mon logiciel actuel ?",
    a: "Votre logiciel gère la réservation. Qovee gère la rédaction du devis, la partie qui prend le plus de temps. Les deux se complètent parfaitement.",
  },
  {
    q: "Mes données clients sont-elles sécurisées ?",
    a: "Vos données sont chiffrées et hébergées en Europe. Elles ne sont jamais utilisées pour entraîner des modèles IA. Vous restez propriétaire de vos informations.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement. Vous annulez en un clic depuis votre espace. Aucun frais d'annulation, aucune question posée.",
  },
  {
    q: "Y a-t-il un support si j'ai besoin d'aide ?",
    a: "Oui, un humain répond, pas un bot. Par email ou par message direct. En général sous 24h ouvrées.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " faq-item-open" : ""}`}>
      <button className="faq-question" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}>
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

export default function Accueil() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCta = () => navigate(user ? "/creer" : "/signup");

  return (
    <div className="app">
      <Nav />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Décris le voyage.<br />
            <span className="hero-title-accent">Qovee rédige le devis.</span>
          </h1>
          <p className="hero-sub">
            Qovee génère un devis voyage pro en 2 minutes.
          </p>
          <button className="hero-cta" onClick={handleCta}>
            Essayer gratuitement 7 jours →
          </button>
          <div className="hero-features">
            {FEATURES.map((f) => (
              <span key={f} className="hero-feature">
                <svg viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6.5 10l2.5 2.5L13.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── La douleur ── */}
      <section className="landing-pain">
        <div className="landing-inner">
          <h2 className="landing-pain-title">
            Vous passez 2h sur 10 onglets pour un devis qui ne signera peut-être jamais.
          </h2>
          <div className="pain-cards">
            {[
              { icon: "✈", label: "Vols",        desc: "Comparateurs, disponibilités, escales…" },
              { icon: "🏨", label: "Hôtels",      desc: "Catégories, emplacements, photos…" },
              { icon: "🗺", label: "Excursions",  desc: "Prestataires, horaires, tarifs groupe…" },
              { icon: "🚐", label: "Transferts",  desc: "Navettes, taxis, distances à calculer…" },
            ].map((c) => (
              <div key={c.label} className="pain-card">
                <span className="pain-card-icon">{c.icon}</span>
                <span className="pain-card-label">{c.label}</span>
                <span className="pain-card-desc">{c.desc}</span>
              </div>
            ))}
          </div>
          <p className="landing-pain-outro">Et si tout ça se faisait en 2 minutes&nbsp;?</p>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="landing-how">
        <div className="landing-inner">
          <div className="how-steps">
            {[
              { n: "01", title: "Décris la demande client", desc: "En langage naturel, directement depuis le message de ton client." },
              { n: "02", title: "Qovee structure tout", desc: "Vols, hôtels, excursions, transferts : organisés et chiffrés automatiquement." },
              { n: "03", title: "Télécharge le PDF pro", desc: "Un devis complet, prêt à envoyer au client en un clic." },
            ].map((s) => (
              <div key={s.n} className="how-step">
                <span className="how-num">{s.n}</span>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pourquoi Qovee ── */}
      <section className="landing-why">
        <div className="landing-inner">
          <p className="why-quote">
            "Conçu par un agent de voyage indépendant,<br />pas par des développeurs."
          </p>
          <div className="why-pillars">
            {[
              { title: "Simple & immédiat",    desc: "Pas de formation. Tu colles la demande, tu télécharges le devis." },
              { title: "Chaleureux & familier", desc: "Le devis ressemble à ce que tu aurais écrit toi-même." },
              { title: "Fiable & sérieux",     desc: "Formatage pro, prix cohérents, document prêt à signer." },
            ].map((p) => (
              <div key={p.title} className="why-pillar">
                <h3 className="why-pillar-title">{p.title}</h3>
                <p className="why-pillar-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="landing-pricing">
        <div className="landing-inner">
          <div className="lp-grid">
            {[
              {
                name  : "Solo",
                price : 29,
                desc  : "1 utilisateur · 20 devis/mois",
                feats : ["20 devis premium/mois", "Export PDF pro", "Historique des devis", "Support humain"],
              },
              {
                name    : "Pro",
                price   : 59,
                desc    : "3 utilisateurs · Devis illimités",
                popular : true,
                feats   : ["Devis illimités", "Branding agence sur PDF", "Historique des devis", "Support prioritaire"],
              },
              {
                name  : "Studio",
                price : 99,
                desc  : "5+ utilisateurs · Multi-agences",
                feats : ["Devis illimités", "Multi-users", "Branding agence sur PDF", "Support prioritaire dédié"],
              },
            ].map((plan) => (
              <div key={plan.name} className={`lp-card${plan.popular ? " lp-card--popular" : ""}`}>
                {plan.popular && <div className="lp-popular-badge">Le plus choisi</div>}
                <div className="lp-plan-name">{plan.name}</div>
                <div className="lp-price">{plan.price}<span className="lp-currency">€</span><span className="lp-period">/mois</span></div>
                <p className="lp-plan-desc">{plan.desc}</p>
                <ul className="lp-features">
                  {plan.feats.map((f) => (
                    <li key={f} className="lp-feature">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="lp-cta" onClick={handleCta}>
                  Commencer l'essai gratuit →
                </button>
              </div>
            ))}
          </div>
          <p className="lp-trial-note">7 jours d'essai gratuit · Sans carte · Annulation à tout moment</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-faq">
        <div className="landing-inner">
          <h2 className="faq-title">Questions fréquentes</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <img src="/favicon.png" width="22" height="22" alt="Qovee" />
            <span className="site-footer-name">Qovee</span>
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
          <p className="site-footer-baseline">Décris le voyage. Qovee rédige le devis.</p>
        </div>
      </footer>
    </div>
  );
}
