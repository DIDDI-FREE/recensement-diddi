# DiddiFree — Enregistrement Terrain (PWA Offline-First)

PWA web-first / offline-first pour le recensement terrain des futurs partenaires
DiddiFree en Côte d'Ivoire : **chauffeurs (DiddiGo)**, **restaurants (DiddiFood)**
et **agents commerciaux**.

Les commerciaux saisissent les fiches sur leur téléphone Android (Chrome), même **sans
réseau** : les données et photos sont stockées localement (IndexedDB), puis
**synchronisées automatiquement** dès que le réseau revient. L'app est installable
sur l'écran d'accueil (PWA).

---

## Stack

| Composant | Choix |
|-----------|-------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS |
| PWA | vite-plugin-pwa (Workbox) |
| Stockage local | IndexedDB via Dexie.js |
| Compression images | browser-image-compression (≤ 500 Ko, max 1200 px) |
| Backend API | Node.js + Express |
| Base de données | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT 30 jours (travail offline après login initial) |
| Déploiement | Docker Compose (frontend Nginx + backend + PostgreSQL) |

## Architecture

```
Téléphone du commercial (Chrome)          VPS (Docker via Portainer)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ React PWA                    │         │  Nginx (frontend, port 3080) │
│ ├── Service Worker (cache)   │   online│  └── proxy /api → backend    │
│ ├── IndexedDB (fiches+photos)│  ──────▶│  Backend Express (port 3081) │
│ └── Sync Manager (push auto) │         │  └── POST /api/sync          │
└──────────────────────────────┘         │  PostgreSQL 16               │
                                         │  Volume uploads (photos)     │
                                         └──────────────────────────────┘
```

Le frontend et le backend sont **dans la même stack Docker** : Nginx sert le PWA
et proxifie `/api` vers le backend. Pas de CORS, pas d'URL séparée.

## Démarrage rapide (Docker)

```bash
cp .env.example .env   # renseigner DB_PASSWORD et JWT_SECRET
docker compose up -d --build
```

- Frontend PWA : http://localhost:3080
- API : http://localhost:3081/api/health

Au premier démarrage (`SEED_ON_START=true`), deux comptes sont créés :

| Rôle | Téléphone | Mot de passe |
|------|-----------|--------------|
| Admin | 0600000000 | diddiadmin2026 |
| Commercial (test) | 0700000000 | diddi2026 |

## Développement local (sans Docker)

Le backend peut tourner sur SQLite pour le dev (variante de schéma fournie) :

```bash
cd backend
cp prisma/schema.sqlite.prisma prisma/schema.prisma   # provider sqlite
npm install
npm run prisma:push && npm run seed                   # base + comptes de test
npm run dev                                           # API sur :3001

cd ../frontend
npm install
npm run dev                                           # PWA sur :5173, /api → :3001
```

> ⚠️ Avant de committer : restaurer `prisma/schema.prisma` avec le provider
> `postgresql` (ou garder `schema.sqlite.prisma` comme référence et ne jamais
> modifier le fichier principal).

## API

```
POST /api/auth/login       Login → { token, commercial }
GET  /api/auth/me          Infos du compte connecté

POST /api/sync             Batch de sync (cœur du système offline)
                           Body : { fiches: [...], photos: [...] }
                           Réponse : { resultats: [{ id_local, statut, message }] }

GET  /api/fiches           Liste (filtres : type, statut, date)
GET  /api/fiches/:id       Détail d'une fiche
GET  /api/photos/:file     Photo (authentifié)
GET  /api/stats            Compteurs dashboard

POST /api/admin/commerciaux      Créer un compte commercial (admin)
GET  /api/admin/commerciaux      Liste des commerciaux
PATCH /api/admin/commerciaux/:id Activer / désactiver un compte
```

### Logique de synchronisation (`POST /api/sync`)

1. **Idempotence** : une fiche déjà reçue (`id_local` connu) → `ok`, pas de doublon créé.
2. **Détection de doublons** : clé `(telephone_sujet, type)`. La fiche au
   `timestamp_local` le plus ancien garde le statut `complet`, la plus récente
   passe `doublon`. Les doublons restent visibles au back-office.
3. Les fiches en erreur restent en attente côté client et sont retentées
   automatiquement (événement `online` + polling 30 s).

## Comptes commerciaux (endpoint admin)

Login avec le compte admin (seed ou créé en base), puis :

```bash
curl -X POST http://localhost:3080/api/admin/commerciaux \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"nom":"N'Guessan","prenom":"Awa","telephone":"0712345678","zone":"Yopougon","mot_de_passe":"secret123"}'
```

## Déploiement sur le VPS (Portainer)

1. Pousser ce repo sur GitHub (privé).
2. Dans Portainer : *Stacks* → *Add stack* → *Git repository* → URL du repo.
3. Définir les variables d'environnement (`DB_PASSWORD`, `JWT_SECRET`,
   `SEED_ON_START=true` pour le premier démarrage).
4. Déployer le stack.
5. Exposer le frontend (port 3080) derrière un reverse proxy **en HTTPS**
   (obligatoire pour le Service Worker / l'installation PWA).
6. Ouvrir l'URL en Chrome sur Android → menu ⋮ → **Ajouter à l'écran d'accueil**.

## Structure

```
diddifree-registration/
├── docker-compose.yml
├── .env.example
├── frontend/                # React PWA (Vite + Tailwind + vite-plugin-pwa)
│   ├── Dockerfile           # Build → Nginx
│   ├── nginx.conf           # Sert le PWA + proxy /api → backend:3000
│   └── src/
│       ├── db/dexie.ts      # Schéma IndexedDB
│       ├── sync/syncManager.ts
│       ├── forms/definitions.ts   # Les 3 formulaires (sections/champs)
│       └── pages/           # Login, Dashboard, FicheForm, Registre, FicheDetail
└── backend/                 # API Express + Prisma
    ├── Dockerfile
    ├── docker-entrypoint.sh # Migrations + seed + démarrage
    └── prisma/              # schema.prisma (+ variant sqlite pour le dev)
```

## Notes terrain

- **Photos** : compressées sur le téléphone (≤ 500 Ko) avant stockage local et envoi.
- **GPS restaurant** : détection automatique (géolocalisation navigateur) + saisie manuelle.
- **JWT 30 jours** : le commercial se connecte une fois (en ligne), puis travaille
  hors-ligne toute la journée ; le sync ne nécessite pas de re-login.
- **Limite sync** : batch de 200 fiches / 500 photos par appel.
