import { Request, Response, NextFunction } from 'express';
import { supabaseConfig } from '../config/supabase.ts';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: 'librarian' | 'student';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireLibrarian = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a Bearer token.'
    });
  }

  const token = authHeader.split(' ')[1];

  // Demo / local testing fallback token
  if (token === 'demo-librarian-token-2026' || token === 'demo-librarian-session-token') {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'librarian@campus.edu',
      role: 'librarian'
    };
    return next();
  }

  // If Supabase Admin Client is active, verify via Supabase Auth
  if (supabaseConfig.isConfigured && supabaseConfig.client) {
    try {
      const { data: { user }, error } = await supabaseConfig.client.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication session.'
        });
      }

      // Query profiles table for role check
      const { data: profile, error: profileError } = await supabaseConfig.client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'librarian') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have librarian privileges.'
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: 'librarian'
      };

      return next();
    } catch (err) {
      console.error('Error verifying librarian authorization:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication service error.'
      });
    }
  }

  // If Supabase not yet configured, allow demo token or reject
  return res.status(401).json({
    success: false,
    error: 'Invalid authentication token. Please sign in.'
  });
};
