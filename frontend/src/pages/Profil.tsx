import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

export default function Profil() {
  const { user, refreshUser } = useAuth();
  const [nom, setNom] = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const input =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

  const enregistrer = async (event: React.FormEvent) => {
    event.preventDefault();
    setErreur(null);
    setSucces(null);
    if (nouveauMotDePasse && nouveauMotDePasse !== confirmation) {
      setErreur('La confirmation du nouveau mot de passe ne correspond pas.');
      return;
    }
    if (nouveauMotDePasse && !ancienMotDePasse) {
      setErreur('Saisissez votre ancien mot de passe pour le modifier.');
      return;
    }

    setEnregistrement(true);
    try {
      await api('/auth/me', {
        method: 'PATCH',
        body: {
          nom,
          prenom,
          email,
          ...(nouveauMotDePasse
            ? {
                ancien_mot_de_passe: ancienMotDePasse,
                nouveau_mot_de_passe: nouveauMotDePasse,
                confirmation_mot_de_passe: confirmation,
              }
            : {}),
        },
      });
      await refreshUser();
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmation('');
      setSucces('Profil mis à jour.');
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Modification impossible');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-gray-900">Mon profil</h1>

      {erreur && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
      {succes && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{succes}</p>}

      <form onSubmit={(event) => void enregistrer(event)} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="border-b border-teal-100 pb-2 font-semibold text-teal-800">Informations personnelles</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={input} required placeholder="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} />
          <input className={input} required placeholder="Prénom *" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <input className={input} type="email" placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Téléphone / identifiant</label>
          <input className={`${input} bg-gray-100`} value={user?.telephone ?? ''} readOnly />
          <p className="mt-1 text-xs text-gray-500">Ce numéro ne peut pas être modifié.</p>
        </div>

        <h2 className="mt-3 border-b border-teal-100 pb-2 font-semibold text-teal-800">Changer le mot de passe</h2>
        <p className="text-sm text-gray-600">Laissez ces champs vides si vous ne souhaitez pas le modifier.</p>
        <input className={input} type="password" autoComplete="current-password" placeholder="Ancien mot de passe" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)} />
        <input className={input} type="password" autoComplete="new-password" minLength={6} placeholder="Nouveau mot de passe (6 caractères minimum)" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} />
        <input className={input} type="password" autoComplete="new-password" minLength={6} placeholder="Confirmer le nouveau mot de passe" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />

        <button type="submit" disabled={enregistrement} className="mt-2 rounded-md bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
