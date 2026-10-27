ALTER TABLE "commerciaux" ADD COLUMN "zones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "commerciaux"
SET "zones" = ARRAY["zone"]::TEXT[]
WHERE "zone" IS NOT NULL AND "zone" <> '';

ALTER TABLE "fiches" ADD COLUMN "zoneEnregistrement" TEXT;

UPDATE "fiches" AS f
SET "zoneEnregistrement" = c."zone"
FROM "commerciaux" AS c
WHERE f."commercialId" = c."id";

CREATE INDEX "fiches_zoneEnregistrement_idx" ON "fiches"("zoneEnregistrement");
