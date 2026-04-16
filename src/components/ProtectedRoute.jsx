import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Redirige vers /login si l'utilisateur n'est pas connecté. */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
