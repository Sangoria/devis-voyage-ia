import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute  from "./components/ProtectedRoute";
import Accueil         from "./pages/Accueil";
import CreerDevis      from "./pages/CreerDevis";
import Login           from "./pages/Login";
import Signup          from "./pages/Signup";
import MesDevis        from "./pages/MesDevis";
import Pricing         from "./pages/Pricing";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pages publiques */}
          <Route path="/"        element={<Accueil />} />
          <Route path="/login"   element={<Login   />} />
          <Route path="/signup"  element={<Signup  />} />
          <Route path="/pricing" element={<Pricing />} />

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
  );
}
