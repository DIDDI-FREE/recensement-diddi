import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FicheForm from './pages/FicheForm';
import Registre from './pages/Registre';
import FicheDetail from './pages/FicheDetail';
import GestionUtilisateurs from './pages/GestionUtilisateurs';
import Profil from './pages/Profil';
import FichesCommercial from './pages/FichesCommercial';
import RapportActivite from './pages/RapportActivite';
import AdminExport from './pages/AdminExport';
import { FORCE_UPDATE_EVENT } from './components/ForceUpdateButton';

function NotificationMiseAJour() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  const [masquee, setMasquee] = useState(false);

  const forcerMiseAJour = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    const actualisation = await navigator.serviceWorker.getRegistration();

    if (actualisation?.waiting) {
      await updateServiceWorker(true);
      return;
    }

    // Même si le service worker est déjà à jour, le rechargement force le
    // navigateur à reprendre l'interface disponible sans toucher à IndexedDB.
    window.location.reload();
  }, [updateServiceWorker]);

  useEffect(() => {
    const demanderMiseAJour = () => {
      void forcerMiseAJour().catch(() => window.location.reload());
    };
    window.addEventListener(FORCE_UPDATE_EVENT, demanderMiseAJour);
    return () => window.removeEventListener(FORCE_UPDATE_EVENT, demanderMiseAJour);
  }, [forcerMiseAJour]);

  if (!needRefresh || masquee) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-lg rounded-xl border border-teal-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700" aria-hidden="true">↻</div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Nouvelle version disponible</p>
          <p className="mt-1 text-sm text-slate-500">Une mise à jour de DiddiFree est prête. Vos fiches déjà enregistrées hors ligne sont conservées.</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => { setMasquee(true); setNeedRefresh(false); }}>Fermer</button>
            <button type="button" className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700" onClick={() => void updateServiceWorker()}>Mettre à jour</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, logout } = useAuth();

  const application = !user ? (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  ) : (
    <HashRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nouveau/:type" element={<FicheForm />} />
          <Route path="/registre" element={<Registre />} />
          <Route path="/fiche/:id" element={<FicheDetail />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/rapports" element={<RapportActivite />} />
          <Route path="/export" element={user.role === 'admin' ? <AdminExport /> : <Navigate to="/" replace />} />
          <Route path="/gestion/commerciaux/:id/fiches" element={<FichesCommercial />} />
          <Route path="/gestion" element={user.role === 'admin' ? <GestionUtilisateurs /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );

  return <><NotificationMiseAJour />{application}</>;
}
