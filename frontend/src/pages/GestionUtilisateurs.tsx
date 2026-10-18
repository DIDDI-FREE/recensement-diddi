import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface CommercialCompte {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  zone: string;
  role: string;
  actif: boolean;
  createdAt: string;
  _count: { fiches: number };
}

interface ImportCommercial {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  commune: string;
  mot_de_passe: string;
}

interface FicheCommercial {
  id: string;
  type: string;
  statut: string;
  telephone_sujet: string;
  timestamp_local: string;
  donnees: Record<string, unknown>;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function parseCommercialCsv(content: string): ImportCommercial[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Le CSV doit contenir un en-tête et au moins une ligne');
  const headers = parseCsvLine(lines[0]);
  const expected = ['nom', 'prenom', 'telephone', 'email', 'commune', 'mot_de_passe'];
  if (!expected.every((header) => headers.includes(header))) {
    throw new Error(`Colonnes attendues : ${expected.join(', ')}`);
  }
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ''])) as unknown as ImportCommercial;
    if (!row.nom || !row.prenom || !row.telephone || !row.commune || !row.mot_de_passe) {
      throw new Error(`Ligne ${index + 2} incomplète`);
    }
    return row;
  });
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
    email: '',
    zone: '',
    motDePasse: '',
    role: 'commercial' as 'commercial' | 'admin',
  });
  const [enCreation, setEnCreation] = useState(false);
  const [importLignes, setImportLignes] = useState<ImportCommercial[]>([]);
  const [importNom, setImportNom] = useState('');
  const [importEnCours, setImportEnCours] = useState(false);
  const [importResultat, setImportResultat] = useState<string | null>(null);
  const [commercialSelectionne, setCommercialSelectionne] = useState<CommercialCompte | null>(null);
  const [fichesSelectionnees, setFichesSelectionnees] = useState<FicheCommercial[]>([]);
  const [chargementFiches, setChargementFiches] = useState(false);
  const [commercialEdition, setCommercialEdition] = useState<CommercialCompte | null>(null);
  const [edition, setEdition] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    zone: '',
    mot_de_passe: '',
  });
  const [enregistrementEdition, setEnregistrementEdition] = useState(false);

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
      setSucces(`Compte ${form.role === 'admin' ? 'ADMIN ' : ''}créé : ${form.prenom} ${form.nom} (${form.telephone})`);
      setForm({ nom: '', prenom: '', telephone: '', email: '', zone: '', motDePasse: '', role: 'commercial' });
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

  const toggleRole = async (c: CommercialCompte) => {
    setErreur(null);
    setSucces(null);
    try {
      await api(`/admin/commerciaux/${c.id}/role`, {
        method: 'PATCH',
        body: { role: c.role === 'admin' ? 'commercial' : 'admin' },
      });
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Action impossible');
    }
  };

  const voirFiches = async (commercial: CommercialCompte) => {
    setErreur(null);
    if (commercialSelectionne?.id === commercial.id) {
      setCommercialSelectionne(null);
      setFichesSelectionnees([]);
      return;
    }
    setCommercialSelectionne(commercial);
    setChargementFiches(true);
    try {
      const result = await api<{ fiches: FicheCommercial[] }>(`/admin/commerciaux/${commercial.id}/fiches`);
      setFichesSelectionnees(result.fiches);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Chargement des fiches impossible');
      setFichesSelectionnees([]);
    } finally {
      setChargementFiches(false);
    }
  };

  const ouvrirEdition = (commercial: CommercialCompte) => {
    setCommercialEdition(commercial);
    setEdition({
      nom: commercial.nom,
      prenom: commercial.prenom,
      telephone: commercial.telephone,
      email: commercial.email ?? '',
      zone: commercial.zone,
      mot_de_passe: '',
    });
  };

  const enregistrerEdition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commercialEdition) return;
    setEnregistrementEdition(true);
    setErreur(null);
    try {
      const { mot_de_passe, ...profil } = edition;
      const body = mot_de_passe ? { ...profil, mot_de_passe } : profil;
      await api(`/admin/commerciaux/${commercialEdition.id}`, { method: 'PATCH', body });
      setSucces(`Compte modifié : ${edition.prenom} ${edition.nom}`);
      setCommercialEdition(null);
      await charger();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Modification impossible');
    } finally {
      setEnregistrementEdition(false);
    }
  };

  const choisirCsv = async (file: File | undefined) => {
    if (!file) return;
    setErreur(null);
    setImportResultat(null);
    try {
      setImportLignes(parseCommercialCsv(await file.text()));
      setImportNom(file.name);
    } catch (error) {
      setImportLignes([]);
      setImportNom('');
      setErreur(error instanceof Error ? error.message : 'CSV invalide');
    }
  };

  const importerCsv = async () => {
    if (importLignes.length === 0) return;
    setImportEnCours(true);
    setErreur(null);
    setImportResultat(null);
    try {
      const result = await api<{ created: number; skipped: number; errors: number }>(
        '/admin/commerciaux/import',
        { method: 'POST', body: { lignes: importLignes } }
      );
      setImportResultat(`${result.created} créé(s), ${result.skipped} ignoré(s), ${result.errors} erreur(s)`);
      setImportLignes([]);
      setImportNom('');
      await charger();
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Import impossible');
    } finally {
      setImportEnCours(false);
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

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">
          Importer des commerciaux en masse
        </h2>
        <p className="mb-3 text-sm text-gray-600">
          CSV attendu : nom, prenom, telephone, email, commune, mot_de_passe.
        </p>
        <input
          className={`${input} mb-3`}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void choisirCsv(e.target.files?.[0])}
        />
        {importNom && <p className="mb-2 text-sm text-gray-600">{importNom} : {importLignes.length} ligne(s) prête(s)</p>}
        {importLignes.length > 0 && (
          <button
            type="button"
            onClick={() => void importerCsv()}
            disabled={importEnCours}
            className="rounded-md bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {importEnCours ? 'Import en cours…' : `Importer ${importLignes.length} commerciaux`}
          </button>
        )}
        {importResultat && <p className="mt-2 text-sm text-green-700">{importResultat}</p>}
      </section>

      {commercialEdition && (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-teal-100 pb-2">
            <h2 className="font-semibold text-teal-800">Modifier le compte</h2>
            <button type="button" onClick={() => setCommercialEdition(null)} className="text-sm text-gray-500 underline">
              Annuler
            </button>
          </div>
          <form onSubmit={(event) => void enregistrerEdition(event)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input className={input} required placeholder="Nom *" value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} />
              <input className={input} required placeholder="Prénom *" value={edition.prenom} onChange={(e) => setEdition({ ...edition, prenom: e.target.value })} />
            </div>
            <input className={input} required type="tel" placeholder="Téléphone *" value={edition.telephone} onChange={(e) => setEdition({ ...edition, telephone: e.target.value })} />
            <input className={input} type="email" placeholder="Email (optionnel)" value={edition.email} onChange={(e) => setEdition({ ...edition, email: e.target.value })} />
            <input className={input} required placeholder="Zone / commune *" value={edition.zone} onChange={(e) => setEdition({ ...edition, zone: e.target.value })} />
            <input className={input} type="password" minLength={6} placeholder="Nouveau mot de passe (optionnel)" value={edition.mot_de_passe} onChange={(e) => setEdition({ ...edition, mot_de_passe: e.target.value })} />
            <button type="submit" disabled={enregistrementEdition} className="rounded-md bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
              {enregistrementEdition ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </section>
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
            type="email"
            placeholder="Email (optionnel)"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
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
          <select
            className={input}
            value={form.role}
            onChange={(e) => onChange('role', e.target.value)}
          >
            <option value="commercial">Rôle : Commercial</option>
            <option value="admin">Rôle : Administrateur</option>
          </select>
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
                    <button type="button" onClick={() => void voirFiches(c)} className="text-left font-semibold text-gray-900 underline decoration-dotted underline-offset-2">
                      {c.prenom} {c.nom}
                      {c.role === 'admin' && (
                        <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                          admin
                        </span>
                      )}
                    </button>
                    <p className="text-sm text-gray-500">
                      📞 {c.telephone} · {c.zone}
                    </p>
                    {c.email && <p className="text-sm text-gray-500">✉️ {c.email}</p>}
                    <p className="text-xs text-gray-400">
                      {c._count.fiches} fiche(s) · créé le{' '}
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => ouvrirEdition(c)}
                      className="rounded-md bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-200"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => void voirFiches(c)}
                      className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      {commercialSelectionne?.id === c.id ? 'Masquer fiches' : 'Voir fiches'}
                    </button>
                    <button
                      onClick={() => void toggleRole(c)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        c.role === 'admin'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {c.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                    </button>
                    {c.role !== 'admin' && (
                      <button
                        onClick={() => void toggleActif(c)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          c.actif
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {c.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                  </div>
                </div>
                {!c.actif && (
                  <p className="mt-1 text-xs font-medium text-red-600">Compte désactivé</p>
                )}
              </div>
            ))}
          </div>
        )}
        {commercialSelectionne && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <h3 className="font-semibold text-blue-900">
              Fiches de {commercialSelectionne.prenom} {commercialSelectionne.nom} ({fichesSelectionnees.length})
            </h3>
            {chargementFiches ? (
              <p className="mt-2 text-sm text-blue-700">Chargement…</p>
            ) : fichesSelectionnees.length === 0 ? (
              <p className="mt-2 text-sm text-blue-700">Aucune fiche enregistrée.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {fichesSelectionnees.map((fiche) => (
                  <Link key={fiche.id} to={`/fiche/${fiche.id}`} className="rounded-md bg-white p-2 text-sm hover:bg-blue-100">
                    <span className="font-medium">{fiche.type}</span> · {fiche.telephone_sujet} · {new Date(fiche.timestamp_local).toLocaleString('fr-FR')}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
