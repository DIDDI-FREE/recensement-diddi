import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

const seedEnvSchema = z.object({
  ADMIN_TELEPHONE: z.string().default('0600000000'),
  ADMIN_PASSWORD: z.string().default('diddiadmin2026'),
  SEED_TELEPHONE: z.string().default('0700000000'),
  SEED_PASSWORD: z.string().default('diddi2026'),
});

/**
 * Crée le compte admin + le commercial de test si absents.
 * Idempotent : ne fait rien si les comptes existent déjà.
 */
export async function seedIfNeeded(): Promise<void> {
  const env = seedEnvSchema.parse(process.env);

  const admin = await prisma.commercial.findUnique({ where: { telephone: env.ADMIN_TELEPHONE } });
  if (!admin) {
    await prisma.commercial.create({
      data: {
        nom: 'Admin',
        prenom: 'DiddiFree',
        telephone: env.ADMIN_TELEPHONE,
        zone: 'Abidjan',
        motDePasse: await bcrypt.hash(env.ADMIN_PASSWORD, 10),
        role: 'admin',
      },
    });
    console.log(`[seed] Compte admin créé : ${env.ADMIN_TELEPHONE}`);
  }

  const test = await prisma.commercial.findUnique({ where: { telephone: env.SEED_TELEPHONE } });
  if (!test) {
    await prisma.commercial.create({
      data: {
        nom: 'Test',
        prenom: 'Commercial',
        telephone: env.SEED_TELEPHONE,
        zone: 'Cocody',
        motDePasse: await bcrypt.hash(env.SEED_PASSWORD, 10),
      },
    });
    console.log(`[seed] Compte commercial de test créé : ${env.SEED_TELEPHONE}`);
  }
}

// Permet aussi `npm run seed` en standalone
if (require.main === module) {
  seedIfNeeded()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
