import { useState } from 'react';

const FORCE_UPDATE_EVENT = 'diddi:force-update';

/** Demande une vérification immédiate du service worker sans toucher à IndexedDB. */
export default function ForceUpdateButton() {
  const [enCours, setEnCours] = useState(false);

  const demanderMiseAJour = () => {
    setEnCours(true);
    window.dispatchEvent(new Event(FORCE_UPDATE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={demanderMiseAJour}
      disabled={enCours}
      className="rounded-lg bg-teal-800 px-2.5 py-2 text-xs font-semibold transition hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70 sm:px-3"
      title="Vérifier et appliquer la dernière version sans supprimer les fiches en attente"
      aria-label="Forcer la mise à jour de l’application"
    >
      {enCours ? 'MàJ…' : 'MàJ'}
    </button>
  );
}

export { FORCE_UPDATE_EVENT };
