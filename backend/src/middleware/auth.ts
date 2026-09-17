import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-a-changer-en-production';
export const JWT_EXPIRES_IN = '30d'; // Le commercial travaille offline toute la journée

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone: string;
  role: 'commercial' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Vérifie le JWT et attache l'utilisateur à req.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ erreur: 'Token manquant' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ erreur: 'Token invalide ou expiré' });
  }
}

/** Réservé aux administrateurs (création de comptes commerciaux). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ erreur: 'Non authentifié' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
    return;
  }
  next();
}
