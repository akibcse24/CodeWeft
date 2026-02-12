import { Request, Response, NextFunction } from 'express';
import { supabase } from '../server';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  scopes?: string[];
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format. Use Bearer token' });
    return;
  }

  const token = parts[1];

  try {
    const { data: accessToken, error } = await supabase
      .from('oauth_access_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !accessToken) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
      return;
    }

    if (new Date(accessToken.expires_at) < new Date()) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
      return;
    }

    if (accessToken.revoked_at) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token revoked' });
      return;
    }

    req.userId = accessToken.user_id;
    req.scopes = accessToken.scopes || [];

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
