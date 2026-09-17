/**
 * Script de seed standalone : `npm run seed`
 * (En Docker, le seed se fait automatiquement au démarrage si SEED_ON_START=true)
 */
import { seedIfNeeded } from '../src/seed-runner';
import prisma from '../src/lib/prisma';

seedIfNeeded()
  .then(async () => {
    await prisma.$disconnect();
    console.log('[seed] Terminé.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
