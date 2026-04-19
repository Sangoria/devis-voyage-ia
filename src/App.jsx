import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider }   from "./contexts/AuthContext";
import ProtectedRoute     from "./components/ProtectedRoute";
import Accueil            from "./pages/Accueil";
import CreerDevis         from "./pages/CreerDevis";
import Login              from "./pages/Login";
import Signup             from "./pages/Signup";
import MesDevis           from "./pages/MesDevis";
import Pricing            from "./pages/Pricing";
import MentionsLegales    from "./pages/legal/MentionsLegales";
import Confidentialite    from "./pages/legal/Confidentialite";
import Cookies            from "./pages/legal/Cookies";
import CGU                from "./pages/legal/CGU";
import CGV                from "./pages/legal/CGV";

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Pages publiques */}
            <Route path="/"        element={<Accueil />} />
            <Route path="/login"   element={<Login   />} />
            <Route path="/signup"  element={<Signup  />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Pages légales */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/confidentialite"  element={<Confidentialite />} />
            <Route path="/cookies"          element={<Cookies />} />
            <Route path="/cgu"              element={<CGU />} />
            <Route path="/cgv"              element={<CGV />} />

            {/* Pages protégées */}
            <Route path="/creer" element={
              <ProtectedRoute><CreerDevis /></ProtectedRoute>
            }/>
            <Route path="/mes-devis" element={
              <ProtectedRoute><MesDevis /></ProtectedRoute>
            }/>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}
