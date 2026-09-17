-- CreateTable
CREATE TABLE "commerciaux" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'commercial',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commerciaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiches" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commercialId" TEXT NOT NULL,
    "timestampLocal" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'complet',
    "telephoneSujet" TEXT NOT NULL,
    "donnees" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "typePhoto" TEXT NOT NULL,
    "fichierPath" TEXT NOT NULL,
    "tailleOctets" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commerciaux_telephone_key" ON "commerciaux"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "fiches_idLocal_key" ON "fiches"("idLocal");

-- CreateIndex
CREATE INDEX "fiches_telephoneSujet_type_idx" ON "fiches"("telephoneSujet", "type");

-- CreateIndex
CREATE INDEX "fiches_commercialId_idx" ON "fiches"("commercialId");

-- CreateIndex
CREATE INDEX "fiches_statut_type_idx" ON "fiches"("statut", "type");

-- AddForeignKey
ALTER TABLE "fiches" ADD CONSTRAINT "fiches_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "commerciaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

