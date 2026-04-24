import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer";
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

const HOW_STEPS = [
  { n: "01", title: "Décris la demande client", desc: "En langage naturel, directement depuis le message de ton client." },
  { n: "02", title: "Qovee structure tout", desc: "Vols, hôtels, excursions, transferts : organisés et chiffrés automatiquement." },
  { n: "03", title: "Télécharge le PDF pro", desc: "Un devis complet, prêt à envoyer au client en un clic." },
];

function HowItWorks() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState([false, false, false]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          HOW_STEPS.forEach((_, i) => {
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 450);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="landing-how" ref={sectionRef}>
      <div className="landing-inner">
        <h2 className="how-title-main">Comment ça marche ?</h2>
        <div className="how-steps">
          {HOW_STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`how-step how-step--anim${visible[i] ? " how-step--visible" : ""}`}>
                <span className="how-num">{s.n}</span>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
              </div>
              {i < HOW_STEPS.length - 1 && (
                <div className={`how-arrow${visible[i] ? " how-arrow--visible" : ""}`}>
                  <svg viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 12 H48" stroke="#C4714A" strokeWidth="2" strokeLinecap="round"
                      className="how-arrow-line" />
                    <path d="M42 5 L54 12 L42 19" stroke="#C4714A" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="how-arrow-head" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

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
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleCta = () => navigate(user ? "/creer" : "/signup");

  async function handleSubscribe(planId) {
    if (!user) { navigate("/signup"); return; }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method  : "POST",
        headers : { "Content-Type": "application/json" },
        body    : JSON.stringify({ userId: user.id, userEmail: user.email, plan: planId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="app">

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
            Vous passez 2h sur 10 onglets pour un devis qui ne sera peut-être jamais validé ?
          </h2>
          <div className="pain-cards">
            {[
              { icon: "✈", label: "Vols",        desc: "Aller-retours, escales, bagages… tout à recopier proprement." },
              { icon: "🏨", label: "Hôtels",      desc: "Descriptions, catégories, inclusions… extraits un par un." },
              { icon: "🗺", label: "Excursions",  desc: "Caler les activités avec le planning vols, coordonner les prestataires…" },
              { icon: "🚐", label: "Transferts",  desc: "Arrivées, départs, distances… synchronisés à la main depuis 3 onglets." },
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
      <HowItWorks />

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
                id    : "solo",
                name  : "Solo",
                price : 29,
                desc  : "1 utilisateur · 20 devis/mois",
                feats : [
                  { text: "20 devis premium/mois",   included: true  },
                  { text: "Export PDF pro",            included: true  },
                  { text: "Historique des devis",      included: true  },
                  { text: "Branding agence sur PDF",          included: false },
                  { text: "Multi-utilisateurs",               included: false },
                  { text: "Tableau de bord & suivi clients",  included: false },
                  { text: "Support limité",                   included: true  },
                ],
              },
              {
                id      : "pro",
                name    : "Pro",
                price   : 59,
                desc    : "3 utilisateurs · Devis illimités",
                popular : true,
                feats   : [
                  { text: "Devis illimités",           included: true  },
                  { text: "Export PDF pro",            included: true  },
                  { text: "Historique des devis",      included: true  },
                  { text: "Branding agence sur PDF",          included: true  },
                  { text: "Multi-utilisateurs",               included: false },
                  { text: "Tableau de bord & suivi clients",  included: false },
                  { text: "Support prioritaire",              included: true  },
                ],
              },
              {
                id    : "studio",
                name  : "Studio",
                price : 99,
                desc  : "5+ utilisateurs · Multi-agences",
                feats : [
                  { text: "Devis illimités",              included: true },
                  { text: "Export PDF pro",               included: true },
                  { text: "Historique des devis",         included: true },
                  { text: "Branding agence sur PDF",          included: true },
                  { text: "Multi-utilisateurs",               included: true },
                  { text: "Tableau de bord & suivi clients",  included: true },
                  { text: "Support prioritaire dédié",        included: true },
                ],
              },
            ].map((plan) => (
              <div key={plan.name} className={`lp-card${plan.popular ? " lp-card--popular" : ""}`}>
                {plan.popular && <div className="lp-popular-badge">Le plus choisi</div>}
                <div className="lp-plan-name">{plan.name}</div>
                <div className="lp-price">{plan.price}<span className="lp-currency">€</span><span className="lp-period">/mois</span></div>
                <p className="lp-plan-desc">{plan.desc}</p>
                <ul className="lp-features">
                  {plan.feats.map((f) => (
                    <li key={f.text} className={`lp-feature${f.included ? "" : " lp-feature--off"}`}>
                      {f.included ? (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button className="lp-cta" onClick={() => handleSubscribe(plan.id)} disabled={loadingPlan === plan.id}>
                  {loadingPlan === plan.id ? "Redirection…" : "Commencer l'essai gratuit →"}
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

      <Footer />
    </div>
  );
}
