import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

type Ligne = {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  commune: string;
  mot_de_passe: string;
};

function parseCsv(filePath: string): Ligne[] {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  const required = ['nom', 'prenom', 'telephone', 'email', 'commune', 'mot_de_passe'];
  for (const header of required) {
    if (!headers.includes(header)) throw new Error(`Colonne manquante : ${header}`);
  }

  return lines.slice(1).filter(Boolean).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ''])) as unknown as Ligne;
    if (!row.nom || !row.prenom || !row.telephone || !row.commune || !row.mot_de_passe) {
      throw new Error(`Ligne ${index + 2} : nom, prénom, téléphone, commune et mot_de_passe sont obligatoires`);
    }
    if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) {
      throw new Error(`Ligne ${index + 2} : email invalide`);
    }
    return row;
  });
}

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage : npm run import:commerciaux -- chemin/vers/commerciaux.csv');

  const rows = parseCsv(path.resolve(input));
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await prisma.commercial.findUnique({ where: { telephone: row.telephone } });
    if (existing) {
      skipped += 1;
      console.log(`IGNORÉ ${row.telephone} : compte déjà existant`);
      continue;
    }

    await prisma.commercial.create({
      data: {
        nom: row.nom,
        prenom: row.prenom,
        telephone: row.telephone,
        email: row.email || null,
        zone: row.commune,
        motDePasse: await bcrypt.hash(row.mot_de_passe, 10),
        role: 'commercial',
      },
    });
    created += 1;
    console.log(`CRÉÉ ${row.telephone} : ${row.prenom} ${row.nom}`);
  }

  console.log(`Import terminé : ${created} créé(s), ${skipped} ignoré(s).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
