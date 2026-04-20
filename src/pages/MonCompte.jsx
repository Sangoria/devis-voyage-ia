import { useState, useRef } from "react";
import Nav from "../components/Nav";
import { useAuth } from "../contexts/AuthContext";
import { supabase, uploadAvatar, uploadLogo } from "../lib/supabase";

const SECTIONS = ["Agence", "Abonnement"];

export default function MonCompte() {
  const { user, profile, isSubscribed, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState("Agence");

  const [form, setForm] = useState({
    agency_name       : profile?.agency_name        ?? "",
    contact_name      : profile?.contact_name       ?? "",
    phone             : profile?.phone              ?? "",
    address           : profile?.address            ?? "",
    website           : profile?.website            ?? "",
    atout_france_num  : profile?.atout_france_num   ?? "",
    garantie_financiere: profile?.garantie_financiere ?? "APST",
    rcp_assurance     : profile?.rcp_assurance      ?? "AXA France",
    accent_color      : profile?.accent_color       ?? "#C4714A",
  });

  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? null);
  const [logoLoading,   setLogoLoading]   = useState(false);
  const [logoPreview,   setLogoPreview]   = useState(profile?.logo_url ?? null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError,   setPortalError]   = useState("");
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError("");
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        agency_name        : form.agency_name,
        contact_name       : form.contact_name,
        phone              : form.phone,
        address            : form.address,
        website            : form.website,
        atout_france_num   : form.atout_france_num,
        garantie_financiere: form.garantie_financiere,
        rcp_assurance      : form.rcp_assurance,
        accent_color       : form.accent_color,
      })
      .eq("id", user.id);
    if (err) {
      setError("Erreur lors de la sauvegarde. Réessayez.");
    } else {
      await refreshProfile();
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image trop lourde (max 2 Mo)."); return; }
    setAvatarLoading(true);
    setError("");
    setAvatarPreview(URL.createObjectURL(file));
    const { url, error: err } = await uploadAvatar(user.id, file);
    if (err) { setError("Erreur lors de l'upload. Réessayez."); setAvatarPreview(profile?.avatar_url ?? null); }
    else { await refreshProfile(); setAvatarPreview(url); }
    setAvatarLoading(false);
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image trop lourde (max 2 Mo)."); return; }
    setLogoLoading(true);
    setError("");
    setLogoPreview(URL.createObjectURL(file));
    const { url, error: err } = await uploadLogo(user.id, file);
    if (err) { setError("Erreur lors de l'upload du logo."); setLogoPreview(profile?.logo_url ?? null); }
    else { await refreshProfile(); setLogoPreview(url); }
    setLogoLoading(false);
  }

  async function handlePortal() {
    setPortalLoading(true);
    setPortalError("");
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
      setPortalError("Impossible d'ouvrir le portail. Réessayez.");
      setPortalLoading(false);
    }
  }

  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <Nav />
      <main className="compte-main">
        <div className="compte-header">
          <h1 className="compte-title">Mon compte</h1>
          <p className="compte-sub">{user?.email}</p>
        </div>

        <div className="compte-layout">
          {/* Sidebar */}
          <nav className="compte-sidebar">
            {SECTIONS.map((s) => (
              <button key={s}
                className={`compte-sidebar-btn${activeSection === s ? " active" : ""}`}
                onClick={() => setActiveSection(s)}>
                {s === "Agence" && (
                  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <rect x="2" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {s === "Abonnement" && (
                  <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
                {s}
              </button>
            ))}
          </nav>

          {/* Contenu */}
          <div className="compte-content">

            {/* ── Agence ── */}
            {activeSection === "Agence" && (
              <form onSubmit={handleSave} className="compte-card">
                <h2 className="compte-card-title">Informations de l'agence</h2>
                <p className="compte-card-sub">Ces informations apparaîtront sur vos devis PDF.</p>

                {error   && <div className="compte-error">{error}</div>}
                {success && <div className="compte-success">Informations sauvegardées.</div>}

                {/* Photo de profil */}
                <div className="compte-avatar-row">
                  <div className="compte-avatar-preview">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="compte-avatar-img"/>
                      : <span className="compte-avatar-initials">
                          {(form.agency_name || user?.email || "?").slice(0,2).toUpperCase()}
                        </span>
                    }
                    {avatarLoading && <div className="compte-avatar-overlay"><span className="cta-spinner"/></div>}
                  </div>
                  <div className="compte-avatar-info">
                    <div className="compte-avatar-label">Photo de profil</div>
                    <div className="compte-avatar-hint">JPG ou PNG · max 2 Mo</div>
                    <button type="button" className="compte-avatar-btn"
                      onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}>
                      {avatarLoading ? "Upload…" : "Changer la photo"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }} onChange={handleAvatarChange}/>
                  </div>
                </div>

                {/* Logo agence */}
                <div className="compte-avatar-row">
                  <div className="compte-logo-preview">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo agence" className="compte-logo-img"/>
                      : <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
                          <rect x="4" y="10" width="32" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="14" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M22 20h8M22 16h6M22 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    }
                    {logoLoading && <div className="compte-avatar-overlay"><span className="cta-spinner"/></div>}
                  </div>
                  <div className="compte-avatar-info">
                    <div className="compte-avatar-label">Logo de l'agence</div>
                    <div className="compte-avatar-hint">Apparaît sur vos devis PDF · PNG ou JPG · max 2 Mo</div>
                    <button type="button" className="compte-avatar-btn"
                      onClick={() => logoInputRef.current?.click()} disabled={logoLoading}>
                      {logoLoading ? "Upload…" : "Importer le logo"}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }} onChange={handleLogoChange}/>
                  </div>
                </div>

                {/* ── Informations générales ── */}
                <div className="compte-section-sep">Informations générales</div>
                <div className="compte-form-grid">
                  <div className="compte-field">
                    <label htmlFor="agency_name">Nom de l'agence</label>
                    <input id="agency_name" name="agency_name"
                      value={form.agency_name} onChange={handleChange}
                      placeholder="Voyages Dupont"/>
                  </div>
                  <div className="compte-field">
                    <label htmlFor="contact_name">Nom du responsable</label>
                    <input id="contact_name" name="contact_name"
                      value={form.contact_name} onChange={handleChange}
                      placeholder="Jean Dupont"/>
                  </div>
                  <div className="compte-field">
                    <label htmlFor="phone">Téléphone</label>
                    <input id="phone" name="phone" type="tel"
                      value={form.phone} onChange={handleChange}
                      placeholder="+33 6 00 00 00 00"/>
                  </div>
                  <div className="compte-field">
                    <label htmlFor="website">Site web
                      <span className="compte-optional"> · optionnel</span>
                    </label>
                    <input id="website" name="website"
                      value={form.website} onChange={handleChange}
                      placeholder="https://votreagence.fr"/>
                  </div>
                  <div className="compte-field compte-field--span2">
                    <label htmlFor="address">Adresse
                      <span className="compte-optional"> · optionnel</span>
                    </label>
                    <input id="address" name="address"
                      value={form.address} onChange={handleChange}
                      placeholder="12 rue de la Paix, 75001 Paris"/>
                  </div>
                  <div className="compte-field compte-field--span2">
                    <label>Email du compte</label>
                    <input value={user?.email ?? ""} readOnly className="compte-input-readonly"/>
                  </div>
                </div>

                {/* ── Informations professionnelles ── */}
                <div className="compte-section-sep">Informations professionnelles</div>
                <div className="compte-form-grid">
                  <div className="compte-field compte-field--span2">
                    <label htmlFor="atout_france_num">Numéro d'immatriculation Atout France
                      <span className="compte-optional"> · optionnel</span>
                    </label>
                    <input id="atout_france_num" name="atout_france_num"
                      value={form.atout_france_num} onChange={handleChange}
                      placeholder="IM075XXXXXXX"/>
                  </div>
                  <div className="compte-field">
                    <label htmlFor="garantie_financiere">Garantie financière</label>
                    <input id="garantie_financiere" name="garantie_financiere"
                      value={form.garantie_financiere} onChange={handleChange}
                      placeholder="APST"/>
                  </div>
                  <div className="compte-field">
                    <label htmlFor="rcp_assurance">RCP Assurance</label>
                    <input id="rcp_assurance" name="rcp_assurance"
                      value={form.rcp_assurance} onChange={handleChange}
                      placeholder="AXA France"/>
                  </div>
                </div>

                {/* ── Personnalisation ── */}
                <div className="compte-section-sep">Personnalisation des devis</div>
                <div className="compte-form-grid">
                  <div className="compte-field">
                    <label htmlFor="accent_color">Couleur principale de vos devis
                      <span className="compte-optional"> · apparaît sur tous vos PDF</span>
                    </label>
                    <div className="compte-color-row">
                      <input id="accent_color" name="accent_color" type="color"
                        value={form.accent_color} onChange={handleChange}
                        className="compte-color-picker"/>
                      <input
                        type="text"
                        value={form.accent_color}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({ ...f, accent_color: val }));
                          setSuccess(false);
                          setError("");
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          const hex = val.startsWith("#") ? val : "#" + val;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setForm((f) => ({ ...f, accent_color: hex }));
                          } else {
                            setForm((f) => ({ ...f, accent_color: profile?.accent_color ?? "#C4714A" }));
                          }
                        }}
                        className="compte-color-hex"
                        placeholder="#C4714A"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                <div className="compte-actions">
                  <button type="submit" className="compte-save-btn" disabled={saving}>
                    {saving ? <><span className="cta-spinner"/>Sauvegarde…</> : "Sauvegarder →"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Abonnement ── */}
            {activeSection === "Abonnement" && (
              <div className="compte-card">
                <h2 className="compte-card-title">Abonnement</h2>
                <p className="compte-card-sub">Gérez votre formule et vos informations de facturation.</p>

                <div className="compte-sub-status">
                  <div className={`compte-sub-badge${isSubscribed ? "" : " compte-sub-badge--free"}`}>
                    {isSubscribed ? "✓ Abonnement actif" : "Essai gratuit"}
                  </div>
                  {profile?.subscription_status && (
                    <span className="compte-sub-detail">{profile.subscription_status}</span>
                  )}
                </div>

                {portalError && <div className="compte-error">{portalError}</div>}

                {isSubscribed ? (
                  <button className="compte-save-btn" onClick={handlePortal} disabled={portalLoading}>
                    {portalLoading ? <><span className="cta-spinner"/>Redirection…</> : "Gérer mon abonnement →"}
                  </button>
                ) : (
                  <a href="/pricing" className="compte-save-btn"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    Passer à un abonnement →
                  </a>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
