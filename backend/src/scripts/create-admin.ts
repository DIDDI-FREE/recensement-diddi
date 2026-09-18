/**
 * Crée un compte admin OU réinitialise son mot de passe s'il existe déjà.
 *
 * Usage (dans le conteneur backend) :
 *   node dist/scripts/create-admin.js <telephone> <mot_de_passe> [nom] [prenom] [zone]
 *
 * Exemple :
 *   node dist/scripts/create-admin.js 0600000000 MonMotDePasse Admin DiddiFree Abidjan
 */
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  const [telephone, motDePasse, nom = 'Admin', prenom = 'DiddiFree', zone = 'Abidjan'] =
    process.argv.slice(2);

  if (!telephone || !motDePasse) {
    console.error(
      'Usage: node dist/scripts/create-admin.js <telephone> <mot_de_passe> [nom] [prenom] [zone]'
    );
    process.exit(1);
  }
  if (motDePasse.length < 6) {
    console.error('Le mot de passe doit faire au moins 6 caractères.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  const existant = await prisma.commercial.findUnique({ where: { telephone } });

  if (existant) {
    await prisma.commercial.update({
      where: { telephone },
      data: { motDePasse: hash, role: 'admin', actif: true, nom, prenom, zone },
    });
    console.log(`✅ Compte ${telephone} promu ADMIN, mot de passe réinitialisé.`);
  } else {
    await prisma.commercial.create({
      data: { nom, prenom, telephone, zone, motDePasse: hash, role: 'admin' },
    });
    console.log(`✅ Compte ADMIN créé : ${telephone}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
