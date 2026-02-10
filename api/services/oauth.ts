import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../server';

const router = Router();

const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_EXPIRY_DAYS = 90;

router.get('/authorize', async (req: Request, res: Response) => {
  const { client_id, redirect_uri, state } = req.query;

  if (!client_id || !redirect_uri) {
    res.status(400).json({ error: 'Bad request', message: 'Missing client_id or redirect_uri' });
    return;
  }

  try {
    const { data: app, error } = await supabase
      .from('oauth_applications')
      .select('id, name, description, website, logo_url, scopes')
      .eq('client_id', client_id)
      .eq('active', true)
      .single();

    if (error || !app) {
      res.status(400).json({ error: 'Bad request', message: 'Invalid client_id' });
      return;
    }

    const allowedUris = (app as any).redirect_uris || [];
    if (!allowedUris.includes(redirect_uri as string)) {
      res.status(400).json({ error: 'Bad request', message: 'Invalid redirect_uri' });
      return;
    }

    res.status(200).json({
      application: {
        id: app.id,
        name: app.name,
        description: app.description,
        website: app.website,
        logo_url: app.logo_url,
        scopes: app.scopes
      },
      state: state || generateToken().slice(0, 16)
    });
  } catch (err) {
    console.error('Authorize error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/token', async (req: Request, res: Response) => {
  const { grant_type, code, refresh_token, client_id, client_secret } = req.body;

  if (!grant_type) {
    res.status(400).json({ error: 'invalid_request', message: 'Missing grant_type' });
    return;
  }

  try {
    if (grant_type === 'authorization_code') {
      if (!code || !client_id || !client_secret) {
        res.status(400).json({ error: 'invalid_request', message: 'Missing required parameters' });
        return;
      }

      const { data: app, error: appError } = await supabase
        .from('oauth_applications')
        .select('*')
        .eq('client_id', client_id)
        .eq('client_secret', client_secret)
        .eq('active', true)
        .single();

      if (appError || !app) {
        res.status(401).json({ error: 'invalid_client', message: 'Invalid client credentials' });
        return;
      }

      const { data: authCode, error: codeError } = await supabase
        .from('oauth_authorization_codes')
        .select('*')
        .eq('code', code)
        .eq('client_id', client_id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !authCode) {
        res.status(400).json({ error: 'invalid_grant', message: 'Invalid or expired authorization code' });
        return;
      }

      await supabase
        .from('oauth_authorization_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', authCode.id);

      const accessToken = generateToken();
      const refreshToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

      const { error: tokenError } = await supabase
        .from('oauth_access_tokens')
        .insert({
          token: accessToken,
          refresh_token: refreshToken,
          user_id: authCode.user_id,
          client_id: client_id,
          scopes: authCode.scopes,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        throw tokenError;
      }

      res.status(200).json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        refresh_token: refreshToken,
        scope: authCode.scopes?.join(' ') || ''
      });

    } else if (grant_type === 'refresh_token') {
      if (!refresh_token || !client_id || !client_secret) {
        res.status(400).json({ error: 'invalid_request', message: 'Missing required parameters' });
        return;
      }

      const { data: app, error: appError } = await supabase
        .from('oauth_applications')
        .select('*')
        .eq('client_id', client_id)
        .eq('client_secret', client_secret)
        .eq('active', true)
        .single();

      if (appError || !app) {
        res.status(401).json({ error: 'invalid_client', message: 'Invalid client credentials' });
        return;
      }

      const { data: existingToken, error: tokenError } = await supabase
        .from('oauth_access_tokens')
        .select('*')
        .eq('refresh_token', refresh_token)
        .eq('client_id', client_id)
        .is('revoked_at', null)
        .single();

      if (tokenError || !existingToken) {
        res.status(400).json({ error: 'invalid_grant', message: 'Invalid refresh token' });
        return;
      }

      await supabase
        .from('oauth_access_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', existingToken.id);

      const newAccessToken = generateToken();
      const newRefreshToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

      const { error: newTokenError } = await supabase
        .from('oauth_access_tokens')
        .insert({
          token: newAccessToken,
          refresh_token: newRefreshToken,
          user_id: existingToken.user_id,
          client_id: client_id,
          scopes: existingToken.scopes,
          expires_at: expiresAt.toISOString()
        });

      if (newTokenError) {
        throw newTokenError;
      }

      res.status(200).json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        refresh_token: newRefreshToken,
        scope: existingToken.scopes?.join(' ') || ''
      });

    } else {
      res.status(400).json({ error: 'unsupported_grant_type', message: 'Unsupported grant type' });
    }
  } catch (err) {
    console.error('Token endpoint error:', err);
    res.status(500).json({ error: 'server_error', message: 'Internal server error' });
  }
});

export default router;
