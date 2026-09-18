import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FicheForm from './pages/FicheForm';
import Registre from './pages/Registre';
import FicheDetail from './pages/FicheDetail';
import GestionUtilisateurs from './pages/GestionUtilisateurs';

export default function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nouveau/:type" element={<FicheForm />} />
          <Route path="/registre" element={<Registre />} />
          <Route path="/fiche/:id" element={<FicheDetail />} />
          <Route
            path="/gestion"
            element={user.role === 'admin' ? <GestionUtilisateurs /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
