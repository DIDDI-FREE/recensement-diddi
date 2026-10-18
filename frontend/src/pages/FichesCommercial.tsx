import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';

interface FicheCommercial {
  id: string;
  type: string;
  statut: string;
  telephone_sujet: string;
  timestamp_local: string;
  donnees: Record<string, unknown>;
}

interface ReponseFiches {
  commercial: { id: string; nom: string; prenom: string };
  fiches: FicheCommercial[];
}

export default function FichesCommercial() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReponseFiches | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void api<ReponseFiches>(`/admin/commerciaux/${id}/fiches`)
      .then(setData)
      .catch((error: unknown) => setErreur(error instanceof Error ? error.message : 'Chargement impossible'))
      .finally(() => setChargement(false));
  }, [id]);

  if (chargement) return <p className="text-center text-gray-500">Chargement des fiches…</p>;
  if (erreur) return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{erreur}</p>;
  if (!data) return <p className="text-center text-gray-500">Commercial introuvable.</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate('/gestion')} className="text-left text-sm text-teal-700 underline">
        ‹ Retour à l’équipe
      </button>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">
          Fiches de {data.commercial.prenom} {data.commercial.nom}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{data.fiches.length} fiche(s) enregistrée(s)</p>
      </div>

      {data.fiches.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">Aucune fiche enregistrée.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.fiches.map((fiche) => (
            <Link key={fiche.id} to={`/fiche/${fiche.id}`} className="rounded-xl bg-white p-4 shadow-sm hover:bg-teal-50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900">{fiche.donnees.nom_enseigne as string || fiche.donnees.nom as string || fiche.type}</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{fiche.statut}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                <span>{fiche.type} · {fiche.telephone_sujet}</span>
                <span>{new Date(fiche.timestamp_local).toLocaleString('fr-FR')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
