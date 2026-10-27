import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

interface LigneRapport {
  commercial: { id: string; nom: string; prenom: string; zone: string };
  total: number;
  par_type: Record<string, number>;
  par_statut: Record<string, number>;
}
interface Rapport { total: number; aujourd_hui: number; par_commercial: LigneRapport[]; }
const labels: Record<string, string> = { chauffeur: 'VTC', livreur: 'Livreur', restaurant: 'Restaurant', agent_commercial: 'Commercial' };

export default function RapportActivite() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setChargement(true);
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    void api<Rapport>(`/stats${query}`).then(setRapport).catch((error: unknown) => setErreur(error instanceof Error ? error.message : 'Chargement impossible')).finally(() => setChargement(false));
  }, [date]);

  return <div className="flex flex-col gap-5"><div><p className="text-sm font-medium text-teal-700">Pilotage</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Suivi d’activité</h1><p className="text-sm text-slate-500">{user?.role === 'admin' ? 'Vue globale de tous les commerciaux.' : user?.role === 'superviseur' ? `Vue des zones : ${user.zones?.join(', ') || user.zone}.` : 'Vos résultats personnels.'}</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Périmètre</p><p className="font-semibold text-slate-900">{user?.role === 'admin' ? 'Tous les commerciaux' : user?.role === 'superviseur' ? 'Mes zones' : 'Moi uniquement'}</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">Jour<input aria-label="Jour d’enregistrement" type="date" className="rounded-lg border border-slate-200 px-3 py-1.5" value={date} onChange={(e) => setDate(e.target.value)} />{date && <button type="button" className="text-teal-700 underline" onClick={() => setDate('')}>Tout</button>}</label></div>{erreur && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}{chargement ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Chargement des résultats…</p> : rapport && <><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Fiches {date ? 'ce jour' : 'au total'}</p><p className="mt-1 text-2xl font-bold text-teal-700">{rapport.total}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Aujourd’hui</p><p className="mt-1 text-2xl font-bold text-emerald-600">{rapport.aujourd_hui}</p></div></div><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3"><h2 className="font-semibold text-slate-900">Résultats par commercial</h2><p className="text-sm text-slate-500">Cliquez sur une ligne pour voir ses fiches.</p></div>{rapport.par_commercial.length === 0 ? <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune fiche dans ce périmètre.</p> : <div className="divide-y divide-slate-100">{rapport.par_commercial.map((ligne) => <Link key={ligne.commercial.id} to={`/gestion/commerciaux/${ligne.commercial.id}/fiches`} className="flex flex-col gap-3 py-4 transition hover:bg-teal-50 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{ligne.commercial.prenom} {ligne.commercial.nom}</p><p className="text-sm text-slate-500">{ligne.commercial.zone} · {ligne.total} fiche(s)</p></div><div className="flex flex-wrap gap-2">{Object.entries(ligne.par_type).map(([type, count]) => <span key={type} className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{labels[type] || type} : {count}</span>)}</div></Link>)}</div>}</section></>}</div>;
}
