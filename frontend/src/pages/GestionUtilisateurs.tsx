import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';

interface CommercialCompte {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone: string;
  role: string;
  actif: boolean;
  createdAt: string;
  _count: { fiches: number };
}

/** Gestion des commerciaux (réservé admin) : liste, création, activation. */
export default function GestionUtilisateurs() {
  const [commerciaux, setCommerciaux] = useState<CommercialCompte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    zone: '',
    motDePasse: '',
  });
  const [enCreation, setEnCreation] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await api<{ commerciaux: CommercialCompte[] }>('/admin/commerciaux');
      setCommerciaux(res.commerciaux);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const onChange = (name: string, value: string) =>
    setForm((f) => ({ ...f, [name]: value }));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCreation(true);
    setErreur(null);
    setSucces(null);
    try {
      await api('/admin/commerciaux', { method: 'POST', body: { ...form } });
      setSucces(`Compte créé : ${form.prenom} ${form.nom} (${form.telephone})`);
      setForm({ nom: '', prenom: '', telephone: '', zone: '', motDePasse: '' });
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Création impossible');
    } finally {
      setEnCreation(false);
    }
  };

  const toggleActif = async (c: CommercialCompte) => {
    setErreur(null);
    setSucces(null);
    try {
      await api(`/admin/commerciaux/${c.id}`, {
        method: 'PATCH',
        body: { actif: !c.actif },
      });
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Action impossible');
    }
  };

  const input =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">Gestion des commerciaux</h1>

      {erreur && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{erreur}</div>
      )}
      {succes && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{succes}</div>
      )}

      {/* Création d'un compte */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">
          Nouveau compte commercial
        </h2>
        <form onSubmit={(e) => void creer(e)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Nom *"
              required
              value={form.nom}
              onChange={(e) => onChange('nom', e.target.value)}
            />
            <input
              className={input}
              placeholder="Prénoms *"
              required
              value={form.prenom}
              onChange={(e) => onChange('prenom', e.target.value)}
            />
          </div>
          <input
            className={input}
            type="tel"
            inputMode="tel"
            placeholder="Téléphone *"
            required
            value={form.telephone}
            onChange={(e) => onChange('telephone', e.target.value)}
          />
          <input
            className={input}
            placeholder="Zone / commune affectée *"
            required
            value={form.zone}
            onChange={(e) => onChange('zone', e.target.value)}
          />
          <input
            className={input}
            type="text"
            placeholder="Mot de passe (min. 6 caractères) *"
            required
            minLength={6}
            value={form.motDePasse}
            onChange={(e) => onChange('motDePasse', e.target.value)}
          />
          <button
            type="submit"
            disabled={enCreation}
            className="rounded-md bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {enCreation ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
      </section>

      {/* Liste des comptes */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">
          Comptes existants ({commerciaux.length})
        </h2>
        {chargement ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : commerciaux.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun compte.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {commerciaux.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg border p-3 ${
                  c.actif ? 'border-teal-200' : 'border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {c.prenom} {c.nom}
                      {c.role === 'admin' && (
                        <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      📞 {c.telephone} · {c.zone}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c._count.fiches} fiche(s) · créé le{' '}
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {c.role !== 'admin' && (
                    <button
                      onClick={() => void toggleActif(c)}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
                        c.actif
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {c.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </div>
                {!c.actif && (
                  <p className="mt-1 text-xs font-medium text-red-600">Compte désactivé</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
