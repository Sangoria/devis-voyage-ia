import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, countDevis } from "../lib/supabase";

const AuthContext = createContext(null);

const FREE_QUOTA = 3;
const SUBSCRIBED_STATUSES = ["active", "trialing"];

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [devisCount, setDevisCount] = useState(0);

  const isSubscribed = SUBSCRIBED_STATUSES.includes(profile?.subscription_status);
  const hasQuota     = isSubscribed || devisCount < FREE_QUOTA;

  // Charge le profil + le compteur de devis si l'user n'est pas abonné
  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);

    const status = data?.subscription_status;
    if (!SUBSCRIBED_STATUSES.includes(status)) {
      const { count } = await countDevis(userId);
      setDevisCount(count ?? 0);
    } else {
      setDevisCount(0); // abonné = pas de compteur
    }
  }, []);

  // Recharge le profil depuis la DB (utile après un checkout Stripe)
  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  // Incrémente localement le compteur après une génération réussie
  function incrementDevisCount() {
    setDevisCount((c) => c + 1);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else { setProfile(null); setDevisCount(0); }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  async function signUp(email, password, agencyName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { agency_name: agencyName } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    user, profile, loading,
    isSubscribed, hasQuota, devisCount, FREE_QUOTA,
    refreshProfile, incrementDevisCount,
    signUp, signIn, signOut,
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#FAF7F2",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #E4D9CE", borderTopColor: "#C4714A",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
