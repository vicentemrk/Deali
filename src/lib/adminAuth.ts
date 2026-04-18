import type { User } from '@supabase/supabase-js';

type AppMetadata = {
  role?: string;
  roles?: string[];
  is_admin?: boolean;
};

/**
 * Authorize admin actions from app_metadata only.
 * user_metadata is user-editable and must not be used for authorization.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;

  const appMetadata = (user.app_metadata ?? {}) as AppMetadata;
  if (appMetadata.role === 'admin') return true;
  if (appMetadata.is_admin === true) return true;
  if (Array.isArray(appMetadata.roles) && appMetadata.roles.includes('admin')) return true;

  return false;
}
